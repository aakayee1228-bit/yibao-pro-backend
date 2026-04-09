import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { useState, useRef } from 'react'
import type { FC } from 'react'
import { Phone, Copy, ImageDown } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
// @ts-ignore
import WxmlToCanvas from 'wxml-to-canvas'

interface QuoteItem {
  id: string
  quote_id: string
  product_id: string | null
  product_name: string
  unit: string
  quantity: string
  unit_price: string
  discount: string
  amount: string
  remark: string | null
}

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  company: string
}

interface Quote {
  id: string
  quote_no: string
  customer_id: string
  status: string
  subtotal: string
  discount: string
  total_amount: string
  remark: string
  valid_days: number
  created_at: string
  customers: Customer | null
  items: QuoteItem[]
}

const QuoteDetailPage: FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [merchantName, setMerchantName] = useState<string>('')

  const wxmlToCanvasRef = useRef<any>(null)

  useDidShow(() => {
    const id = Taro.getCurrentInstance().router?.params?.id
    if (id) {
      fetchQuoteDetail(id)
    }

    // 获取商家信息
    loadMerchantInfo()
  })

  // 加载商家信息
  const loadMerchantInfo = async () => {
    try {
      const res = await Network.request({
        url: '/api/merchants/info',
        method: 'GET',
      })

      console.log('[商家信息] 响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const data = res.data.data as { shop_name: string }
        setMerchantName(data.shop_name || '')
      }
    } catch (error) {
      console.error('[商家信息] 加载失败:', error)
    }
  }

  const fetchQuoteDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: `/api/quotes/${id}`,
        method: 'GET',
      })

      console.log('获取表单详情响应:', res.statusCode, res.data)

      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: Quote }
        setQuote(responseData.data || null)
      }
    } catch (err) {
      console.error('获取表单详情失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 配置分享功能
  useShareAppMessage(() => {
    if (!quote) {
      return {
        title: '易表单 - 查看表单详情',
        path: '/pages/quotes/index',
      }
    }

    const customerName = quote.customers?.name || '客户'
    const amount = Number(quote.total_amount).toFixed(2)

    return {
      title: `【${quote.quote_no}】${customerName} - ¥${amount}`,
      path: `/pages/quotes/detail/index?id=${quote.id}`,
    }
  })

  // 删除表单
  const handleDelete = () => {
    if (!quote) return

    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个表单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const deleteRes = await Network.request({
              url: `/api/quotes/${quote.id}`,
              method: 'DELETE',
            })

            if (deleteRes.statusCode === 200) {
              Taro.showToast({ title: '删除成功', icon: 'success' })
              setTimeout(() => {
                Taro.navigateBack()
              }, 1500)
            } else {
              Taro.showToast({ title: '删除失败', icon: 'none' })
            }
          } catch (err) {
            console.error('删除表单失败:', err)
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  // 复制分享文案
  const handleCopyLink = () => {
    if (!quote) return

    const customerName = quote.customers?.name || '客户'
    const amount = Number(quote.total_amount).toFixed(2)

    Taro.setClipboardData({
      data: `【易表单】${customerName} 您好，这是您的表单：\n单号：${quote.quote_no}\n金额：¥${amount}\n\n请在微信中搜索「易表单」小程序查看详情。`,
    })
    Taro.showToast({ title: '已复制分享文案', icon: 'success' })
  }

  // 生成图片
  const handleGenerateImage = async () => {
    if (!quote || !wxmlToCanvasRef.current) return

    setGenerating(true)
    try {
      // 构建订单详情的 WXML 模板
      const wxml = `
        <view class="container">
          <!-- 顶部标题 -->
          <view class="header">
            <text class="header-title">产品报价单</text>
          </view>

          <!-- 客户信息 -->
          <view class="info-section">
            <view class="info-row">
              <text class="info-label">客户</text>
              <text class="info-value">${quote.customers?.name || '客户'}</text>
            </view>
            ${quote.customers?.company ? `
            <view class="info-row">
              <text class="info-label">公司</text>
              <text class="info-value">${quote.customers.company}</text>
            </view>
            ` : ''}
            ${quote.customers?.phone ? `
            <view class="info-row">
              <text class="info-label">电话</text>
              <text class="info-value">${quote.customers.phone}</text>
            </view>
            ` : ''}
            <view class="info-row">
              <text class="info-label">单号</text>
              <text class="info-value">${quote.quote_no}</text>
            </view>
            <view class="info-row">
              <text class="info-label">日期</text>
              <text class="info-value">${quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : '-'}</text>
            </view>
            <view class="info-row">
              <text class="info-label">有效期</text>
              <text class="info-value">${quote.valid_days} 天</text>
            </view>
          </view>

          <!-- 商品明细 -->
          <view class="table-section">
            <view class="table-header">
              <text class="table-cell col-index">序号</text>
              <text class="table-cell col-name">品名</text>
              <text class="table-cell col-unit">单位</text>
              <text class="table-cell col-qty">数量</text>
              <text class="table-cell col-price">单价</text>
              <text class="table-cell col-total">合计</text>
            </view>
            ${quote.items && quote.items.length > 0 ? quote.items.map((item, index) => `
            <view class="table-row ${index % 2 === 0 ? 'row-even' : 'row-odd'}">
              <text class="table-cell col-index">${index + 1}</text>
              <text class="table-cell col-name">${item.product_name}</text>
              <text class="table-cell col-unit">${item.unit}</text>
              <text class="table-cell col-qty">${item.quantity}</text>
              <text class="table-cell col-price">¥${Number(item.unit_price).toFixed(2)}</text>
              <text class="table-cell col-total">¥${Number(item.amount).toFixed(2)}</text>
            </view>
            `).join('') : ''}
          </view>

          <!-- 金额汇总 -->
          <view class="summary-section">
            <view class="summary-row">
              <text class="summary-label">商品金额</text>
              <text class="summary-value">¥${Number(quote.subtotal).toFixed(2)}</text>
            </view>
            ${Number(quote.discount) > 0 ? `
            <view class="summary-row">
              <text class="summary-label discount">优惠金额</text>
              <text class="summary-value discount">-¥${Number(quote.discount).toFixed(2)}</text>
            </view>
            ` : ''}
            <view class="summary-divider"></view>
            <view class="summary-row total">
              <text class="summary-label">合计</text>
              <text class="summary-value">¥${Number(quote.total_amount).toFixed(2)}</text>
            </view>
          </view>

          ${quote.remark ? `
          <!-- 备注 -->
          <view class="remark-section">
            <text class="remark-label">备注：${quote.remark}</text>
          </view>
          ` : ''}

          <!-- 水印 -->
          <view class="watermark">
            <text class="watermark-text">${merchantName ? `仅供 ${merchantName} 参考` : '仅供商家参考'}</text>
          </view>

          <!-- 底部说明 -->
          <view class="footer">
            <text class="footer-text">此报价单仅供参考，请以实际交易为准</text>
          </view>
        </view>
      `

      const style = {
        container: {
          width: 750,
          backgroundColor: '#ffffff',
          paddingBottom: 50,
        },
        header: {
          width: 750,
          height: 120,
          backgroundColor: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        'header-title': {
          fontSize: 48,
          fontWeight: 'bold',
          color: '#ffffff',
        },
        'info-section': {
          width: 710,
          marginTop: 20,
          marginLeft: 20,
          marginRight: 20,
          padding: 20,
          backgroundColor: '#f9fafb',
          borderRadius: 10,
        },
        'info-row': {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        },
        'info-label': {
          fontSize: 28,
          color: '#6b7280',
          fontWeight: 'bold',
        },
        'info-value': {
          fontSize: 28,
          color: '#1f2937',
          textAlign: 'right',
        },
        'table-section': {
          width: 710,
          marginTop: 20,
          marginLeft: 20,
          marginRight: 20,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          overflow: 'hidden',
        },
        'table-header': {
          width: 710,
          height: 80,
          backgroundColor: '#1e40af',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        },
        'table-cell': {
          fontSize: 24,
          color: '#374151',
          textAlign: 'center',
        },
        'col-index': {
          width: 80,
        },
        'col-name': {
          width: 180,
          textAlign: 'left',
          paddingLeft: 10,
        },
        'col-unit': {
          width: 80,
        },
        'col-qty': {
          width: 80,
        },
        'col-price': {
          width: 120,
        },
        'col-total': {
          width: 150,
          fontWeight: 'bold',
          color: '#1e40af',
        },
        'table-header .table-cell': {
          color: '#ffffff',
          fontWeight: 'bold',
        },
        'table-row': {
          width: 710,
          height: 80,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
        },
        'row-even': {
          backgroundColor: '#ffffff',
        },
        'row-odd': {
          backgroundColor: '#f8fafc',
        },
        'summary-section': {
          width: 710,
          marginTop: 20,
          marginLeft: 20,
          marginRight: 20,
          padding: 20,
          backgroundColor: '#f9fafb',
          borderRadius: 10,
        },
        'summary-row': {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        },
        'summary-label': {
          fontSize: 28,
          color: '#6b7280',
          textAlign: 'right',
        },
        'summary-value': {
          fontSize: 32,
          color: '#1f2937',
          fontWeight: 'bold',
          textAlign: 'right',
        },
        'summary-row.discount .summary-label': {
          color: '#ef4444',
        },
        'summary-row.discount .summary-value': {
          color: '#ef4444',
        },
        'summary-divider': {
          width: '100%',
          height: 1,
          backgroundColor: '#e5e7eb',
          marginTop: 10,
          marginBottom: 20,
        },
        'summary-row.total': {
          marginTop: 10,
        },
        'summary-row.total .summary-label': {
          fontSize: 32,
          color: '#1f2937',
        },
        'summary-row.total .summary-value': {
          fontSize: 40,
          color: '#1e40af',
        },
        'remark-section': {
          width: 710,
          marginTop: 20,
          marginLeft: 20,
          marginRight: 20,
          padding: 15,
          backgroundColor: '#f9fafb',
          borderRadius: 10,
        },
        'remark-label': {
          fontSize: 24,
          color: '#6b7280',
        },
        watermark: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: 750,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.1,
        },
        'watermark-text': {
          fontSize: 60,
          color: '#1e40af',
          fontWeight: 'bold',
          transform: 'rotate(-30deg)',
        },
        footer: {
          width: 750,
          marginTop: 40,
          textAlign: 'center',
        },
        'footer-text': {
          fontSize: 20,
          color: '#9ca3af',
        },
      }

      // 渲染到 Canvas
      const result = await wxmlToCanvasRef.current.renderToCanvas({ wxml, style })

      // 导出为图片
      const tempFilePath = await wxmlToCanvasRef.current.canvasToTempFilePath({
        fileType: 'png',
        quality: 1,
        destWidth: result.width,
        destHeight: result.height,
      })

      // 预览图片
      Taro.previewImage({
        urls: [tempFilePath],
        current: tempFilePath,
      })

      // 显示操作提示
      Taro.showModal({
        title: '图片已生成',
        content: '长按图片可保存到相册，或点击右上角分享给客户',
        showCancel: false,
      })
    } catch (err) {
      console.error('生成图片失败:', err)
      Taro.showToast({ title: '生成失败', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Text className="text-sm text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!quote) {
    return (
      <View className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Text className="text-sm text-gray-400">表单不存在</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* wxml-to-canvas 组件 */}
      <WxmlToCanvas ref={wxmlToCanvasRef} className="hidden" />

      <ScrollView className="flex-1">
        <View className="p-4 pb-32">
          {/* 顶部蓝色标题区域 */}
          <View className="bg-gradient-to-r from-blue-800 to-blue-500 px-4 py-4 rounded-t-lg mb-4">
            <Text className="block text-2xl font-bold text-center text-white">产品报价单</Text>
          </View>

          {/* 白色卡片内容 */}
          <View className="bg-white rounded-b-lg shadow-sm px-4 py-4 mb-4">
            {/* 两列信息布局 */}
            <View className="flex flex-row gap-4 mb-4">
              {/* 左列 - 客户信息 */}
              <View className="flex-1">
                <Text className="block text-base font-bold text-gray-900 mb-2">
                  客户：{quote.customers?.name || '客户'}
                </Text>
                {quote.customers?.company && (
                  <Text className="block text-sm text-gray-600 mb-1">{quote.customers.company}</Text>
                )}
                {quote.customers?.phone && (
                  <View className="flex items-center">
                    <Phone size={14} color="#1e40af" />
                    <Text className="text-sm text-blue-700 ml-1">{quote.customers.phone}</Text>
                  </View>
                )}
              </View>

              {/* 右列 - 表单信息 */}
              <View className="flex-1 text-right">
                <View className="mb-2">
                  <Text className="text-sm text-gray-600">单号</Text>
                  <Text className="block text-sm font-medium text-gray-900">{quote.quote_no}</Text>
                </View>
                <View className="mb-2">
                  <Text className="text-sm text-gray-600">日期</Text>
                  <Text className="block text-sm font-medium text-gray-900">
                    {quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : '-'}
                  </Text>
                </View>
                <View className="mb-2">
                  <Text className="text-sm text-gray-600">有效期</Text>
                  <Text className="block text-sm font-medium text-gray-900">{quote.valid_days} 天</Text>
                </View>
              </View>
            </View>

            {/* 水平分隔线 */}
            <View className="h-1 bg-blue-800 rounded mb-4" />

            {/* 商品明细表格 */}
            <View className="overflow-hidden mb-4">
              <View className="flex bg-blue-800 text-white text-xs font-medium">
                <Text className="flex-1 py-2 text-center border-r border-blue-700">序号</Text>
                <Text className="flex-[2] py-2 text-center border-r border-blue-700">品名</Text>
                <Text className="flex-1 py-2 text-center border-r border-blue-700">单位</Text>
                <Text className="flex-1 py-2 text-center border-r border-blue-700">数量</Text>
                <Text className="flex-1 py-2 text-center border-r border-blue-700">单价</Text>
                <Text className="flex-1 py-2 text-center">合计</Text>
              </View>

              {quote.items && quote.items.length > 0 ? (
                quote.items.map((item, index) => (
                  <View key={item.id} className={`flex text-sm ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <Text className="flex-1 py-2 text-center border-r border-gray-200 text-gray-900">
                      {index + 1}
                    </Text>
                    <Text className="flex-[2] py-2 px-2 border-r border-gray-200 text-gray-900">
                      {item.product_name}
                    </Text>
                    <Text className="flex-1 py-2 text-center border-r border-gray-200 text-gray-600">
                      {item.unit}
                    </Text>
                    <Text className="flex-1 py-2 text-center border-r border-gray-200 text-gray-900">
                      {item.quantity}
                    </Text>
                    <Text className="flex-1 py-2 text-center border-r border-gray-200 text-gray-900">
                      ¥{Number(item.unit_price).toFixed(2)}
                    </Text>
                    <Text className="flex-1 py-2 text-center text-blue-800 font-medium">
                      ¥{Number(item.amount).toFixed(2)}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="py-8 text-center text-gray-400">
                  <Text className="text-sm">暂无商品明细</Text>
                </View>
              )}
            </View>

            {/* 金额汇总 */}
            <View className="bg-gray-50 rounded-lg p-4">
              <View className="flex justify-between items-center mb-2">
                <Text className="text-sm text-gray-600">商品金额</Text>
                <Text className="text-base font-medium text-gray-900">
                  ¥{Number(quote.subtotal).toFixed(2)}
                </Text>
              </View>

              {Number(quote.discount) > 0 && (
                <View className="flex justify-between items-center mb-2">
                  <Text className="text-sm text-red-600">优惠金额</Text>
                  <Text className="text-base font-medium text-red-600">
                    -¥{Number(quote.discount).toFixed(2)}
                  </Text>
                </View>
              )}

              <View className="border-t border-gray-200 pt-2 mt-2">
                <View className="flex justify-between items-center">
                  <Text className="text-lg font-bold text-gray-900">合计</Text>
                  <Text className="text-xl font-bold text-blue-800">
                    ¥{Number(quote.total_amount).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {quote.remark && (
              <View className="mt-4 bg-gray-50 rounded-lg p-4">
                <Text className="text-sm text-gray-600">
                  <Text className="font-medium">备注：</Text>
                  {quote.remark}
                </Text>
              </View>
            )}
          </View>

          {/* 操作按钮 */}
          <View className="flex gap-2">
            {quote.status === 'draft' && (
              <Button
                variant="destructive"
                size="lg"
                className="flex-1"
                onClick={handleDelete}
              >
                删除
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleCopyLink}
            >
              <Copy size={16} color="#6b7280" className="mr-2" />
              复制文案
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleGenerateImage}
              disabled={generating}
            >
              <ImageDown size={16} color="#1e40af" className="mr-2" />
              {generating ? '生成中...' : '生成图片'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default QuoteDetailPage
