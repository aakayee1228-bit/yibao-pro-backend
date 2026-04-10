import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Phone, Share2, Copy, ImageDown } from 'lucide-react-taro'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'

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
  company_name?: string
  contact_person?: string
  contact_phone?: string
  contact_address?: string
  contact_email?: string
  customers: Customer | null
  items: QuoteItem[]
}

const QuoteDetailPage: FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useDidShow(() => {
    const id = Taro.getCurrentInstance().router?.params?.id
    if (id) {
      fetchQuoteDetail(id)
    }
  })

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: '草稿', variant: 'secondary' },
      sent: { label: '已发送', variant: 'default' },
      accepted: { label: '已成交', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
    }
    return statusMap[status] || { label: status, variant: 'secondary' }
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

  // 生成带水印的图片（调用后端接口）
  const handleGenerateImage = async () => {
    if (!quote) return

    setGenerating(true)
    try {
      console.log('开始生成图片，报价单ID:', quote.id)

      // 调用后端接口生成图片
      const res = await Network.request({
        url: `/api/canvas/quote/${quote.id}`,
        method: 'GET',
        responseType: 'arraybuffer',
      })

      console.log('后端接口返回数据长度:', res.data.byteLength)

      // 保存为临时文件
      const imagePath = `${Taro.env.USER_DATA_PATH}/quote_${Date.now()}.png`
      Taro.getFileSystemManager().writeFileSync(
        imagePath,
        res.data as ArrayBuffer,
        'binary'
      )

      console.log('临时文件路径:', imagePath)

      // 预览图片
      Taro.previewImage({
        urls: [imagePath],
        current: imagePath,
      })

      // 显示操作提示
      Taro.showModal({
        title: '图片已生成',
        content: '长按图片可保存到相册，或点击右上角分享给客户',
        showCancel: false,
        confirmText: '知道了',
      })
    } catch (err) {
      console.error('生成图片异常:', err)
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

  const statusInfo = getStatusBadge(quote.status)

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-4 pb-32">
          {/* 顶部蓝色标题区域 */}
          <View className="bg-gradient-to-r from-blue-800 to-blue-500 px-4 py-4 rounded-t-lg mb-4">
            <Text className="block text-2xl font-bold text-center text-white">产品报价单</Text>
          </View>

          {/* 白色卡片内容 */}
          <View className="bg-white rounded-b-lg shadow-sm px-4 py-4 mb-4">
            {/* 报价方信息 */}
            {(quote.company_name || quote.contact_person || quote.contact_phone) && (
              <View className="mb-4 pb-4 border-b border-gray-100">
                <Text className="block text-base font-bold text-gray-900 mb-2">报价方信息</Text>
                {quote.company_name && (
                  <Text className="block text-sm text-gray-600 mb-1">{quote.company_name}</Text>
                )}
                {quote.contact_person && (
                  <Text className="block text-sm text-gray-600 mb-1">联系人：{quote.contact_person}</Text>
                )}
                {quote.contact_phone && (
                  <Text className="block text-sm text-gray-600 mb-1">电话：{quote.contact_phone}</Text>
                )}
                {quote.contact_address && (
                  <Text className="block text-sm text-gray-600">地址：{quote.contact_address}</Text>
                )}
              </View>
            )}

            {/* 两列信息布局 */}
            <View className="flex flex-row gap-4 mb-4">
              {/* 左列 - 客户方信息 */}
              <View className="flex-1">
                <Text className="block text-base font-bold text-gray-900 mb-2">
                  客户方信息：{quote.customers?.name || '客户'}
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
            <View className="mb-4">
              <Text className="block text-base font-bold text-gray-900 mb-3">商品明细</Text>
              
              {/* 表头 */}
              <View className="flex bg-blue-800 rounded-t">
                <View className="flex-1 py-2 px-1">
                  <Text className="block text-xs text-center text-white font-medium">序号</Text>
                </View>
                <View className="flex-2 py-2 px-2">
                  <Text className="block text-xs text-center text-white font-medium">品名</Text>
                </View>
                <View className="flex-1 py-2 px-1">
                  <Text className="block text-xs text-center text-white font-medium">单位</Text>
                </View>
                <View className="flex-1 py-2 px-1">
                  <Text className="block text-xs text-center text-white font-medium">数量</Text>
                </View>
                <View className="flex-1 py-2 px-1">
                  <Text className="block text-xs text-center text-white font-medium">单价</Text>
                </View>
                <View className="flex-1 py-2 px-1">
                  <Text className="block text-xs text-center text-white font-medium">合计</Text>
                </View>
              </View>

              {/* 表格内容 */}
              {quote.items && quote.items.length > 0 ? (
                <View className="border border-gray-200 border-t-0 rounded-b">
                  {quote.items.map((item, index) => (
                    <View 
                      key={item.id || index} 
                      className={`flex ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200 last:border-0`}
                    >
                      <View className="flex-1 py-3 px-1">
                        <Text className="block text-sm text-center text-gray-700">{index + 1}</Text>
                      </View>
                      <View className="flex-2 py-3 px-2">
                        <Text className="block text-sm text-left text-gray-700">{item.product_name}</Text>
                      </View>
                      <View className="flex-1 py-3 px-1">
                        <Text className="block text-sm text-center text-gray-700">{item.unit}</Text>
                      </View>
                      <View className="flex-1 py-3 px-1">
                        <Text className="block text-sm text-center text-gray-700">{item.quantity}</Text>
                      </View>
                      <View className="flex-1 py-3 px-1">
                        <Text className="block text-sm text-center text-gray-700">¥{Number(item.unit_price).toFixed(2)}</Text>
                      </View>
                      <View className="flex-1 py-3 px-1">
                        <Text className="block text-sm text-center text-blue-700 font-medium">¥{Number(item.amount).toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-gray-400 text-center py-4">暂无商品</Text>
              )}
            </View>

            {/* 金额汇总 */}
            <View className="border border-gray-200 rounded-lg p-4 mb-4">
              <View className="flex justify-between items-center mb-2">
                <Text className="text-sm text-gray-600">商品金额</Text>
                <Text className="text-sm text-gray-900">¥{Number(quote.subtotal).toFixed(2)}</Text>
              </View>
              {Number(quote.discount) > 0 && (
                <View className="flex justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600">优惠金额</Text>
                  <Text className="text-sm text-red-500">-¥{Number(quote.discount).toFixed(2)}</Text>
                </View>
              )}
              <View className="border-t border-gray-200 pt-2 mt-2">
                <View className="flex justify-between items-center">
                  <Text className="text-base font-bold text-gray-900">合计金额</Text>
                  <Text className="text-xl font-bold text-blue-700">¥{Number(quote.total_amount).toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* 备注 */}
            {quote.remark && (
              <View className="mb-2">
                <Text className="block text-sm text-gray-600">备注：{quote.remark}</Text>
              </View>
            )}
          </View>

          {/* 状态标签 */}
          <View className="flex justify-center mb-4">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </View>

          {/* 底部说明 */}
          <Text className="block text-xs text-center text-gray-400">此报价单仅供参考，请以实际交易为准</Text>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100" style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
        <View
          style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px', borderRadius: '8px', backgroundColor: '#f3f4f6' }}
          onClick={handleCopyLink}
        >
          <Copy size={16} color="#374151" />
          <Text className="text-sm text-gray-700">复制</Text>
        </View>
        <View
          style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px', borderRadius: '8px', backgroundColor: '#22c55e' }}
          onClick={handleGenerateImage}
        >
          <ImageDown size={16} color="#ffffff" />
          <Text className="text-sm text-white">{generating ? '生成中...' : '生成图片'}</Text>
        </View>
        <Button
          style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px', borderRadius: '8px', backgroundColor: '#2563eb', border: 'none' }}
          openType="share"
        >
          <Share2 size={16} color="#ffffff" />
          <Text className="text-sm text-white">分享</Text>
        </Button>
      </View>
    </View>
  )
}

export default QuoteDetailPage
