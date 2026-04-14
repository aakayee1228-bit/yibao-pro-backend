import { View, Text, ScrollView, Canvas } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
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
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const canvasRef = useRef<any>(null)

  const router = Taro.useRouter()
  const { id } = router.params

  useDidShow(() => {
    if (id) {
      fetchQuoteDetail()
    }
  })

  // 分享配置
  useShareAppMessage(() => {
    if (!quote) return {}
    return {
      title: `${quote.customers?.name || '客户'}的报价单 - ${quote.quote_no}`,
      path: `/pages/quotes/detail/index?id=${quote.id}`,
    }
  })

  useShareTimeline(() => {
    if (!quote) return {}
    return {
      title: `${quote.customers?.name || '客户'}的报价单 - ${quote.quote_no}`,
      query: `id=${quote.id}`,
    }
  })

  const fetchQuoteDetail = async () => {
    if (!id) return

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

  // 复制小程序链接
  const handleCopyLink = () => {
    if (!quote) return

    // 获取小程序的完整链接
    const appId = Taro.getAccountInfoSync().miniProgram.appId
    const path = `/pages/quotes/detail/index?id=${quote.id}`

    // 复制小程序链接到剪贴板
    Taro.setClipboardData({
      data: `${appId}#${path}`,
    })

    Taro.showModal({
      title: '链接已复制',
      content: '小程序链接已复制到剪贴板，可以在微信中粘贴发送给朋友',
      showCancel: false,
      confirmText: '知道了',
    })
  }

  // 使用前端 Canvas 生成图片（解决中文乱码问题）
  const handleGenerateImage = async () => {
    if (!quote) return

    setGenerating(true)
    try {
      console.log('开始生成图片（前端Canvas）')

      // 获取屏幕宽度
      const { windowWidth } = Taro.getSystemInfoSync()

      // 创建离屏 Canvas
      const canvas = Taro.createOffscreenCanvas({
        type: '2d',
        width: windowWidth * 2, // 高清
        height: 1800 * 2, // 高清
      })

      const ctx = canvas.getContext('2d')

      // 缩放以支持高清屏
      ctx.scale(2, 2)

      // 配色方案
      const overallBgColor = '#F5F5F5'
      const cardBgColor = '#FFFFFF'
      const blue800 = '#1E40AF'
      const blue500 = '#3B82F6'
      const lineColor = '#E5E7EB'
      const textColor = '#111827'
      const gray600 = '#4B5563'
      const white = '#FFFFFF'

      // 整体背景
      ctx.fillStyle = overallBgColor
      ctx.fillRect(0, 0, windowWidth, 1800)

      let y = 20
      const padding = 16
      const cardWidth = windowWidth - padding * 2

      // 标题栏（蓝色渐变）
      const gradient = ctx.createLinearGradient(padding, y, padding + cardWidth, y)
      gradient.addColorStop(0, blue800)
      gradient.addColorStop(1, blue500)
      ctx.fillStyle = gradient
      ctx.fillRect(padding, y, cardWidth, 64)

      // 标题文字
      y += 42
      ctx.fillStyle = white
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('报价单', windowWidth / 2, y)

      y += 20

      // 白色卡片
      ctx.fillStyle = cardBgColor
      ctx.fillRect(padding, y, cardWidth, 1500)

      // 报价方信息
      if (quote.company_name || quote.contact_person || quote.contact_phone) {
        const infoHeight = 130
        ctx.fillStyle = blue500
        ctx.fillRect(padding, y, cardWidth, 35)
        ctx.fillStyle = white
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('报价方信息', padding + 16, y + 22)

        y += 35
        ctx.fillStyle = textColor
        ctx.font = '14px sans-serif'
        let infoY = y + 16

        if (quote.company_name) {
          ctx.fillText(`公司名称：${quote.company_name}`, padding + 16, infoY)
          infoY += 28
        }
        if (quote.contact_person) {
          ctx.fillText(`联系人：${quote.contact_person}`, padding + 16, infoY)
          infoY += 28
        }
        if (quote.contact_phone) {
          ctx.fillText(`联系电话：${quote.contact_phone}`, padding + 16, infoY)
          infoY += 28
        }
        y += 95
      }

      // 客户信息
      if (quote.customers) {
        ctx.fillStyle = gray600
        ctx.fillRect(padding, y, cardWidth, 35)
        ctx.fillStyle = white
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('客户信息', padding + 16, y + 22)

        y += 35
        ctx.fillStyle = textColor
        ctx.font = '14px sans-serif'
        let infoY = y + 16

        if (quote.customers.name) {
          ctx.fillText(`客户姓名：${quote.customers.name}`, padding + 16, infoY)
          infoY += 28
        }
        if (quote.customers.phone) {
          ctx.fillText(`联系电话：${quote.customers.phone}`, padding + 16, infoY)
          infoY += 28
        }
        if (quote.customers.address) {
          ctx.fillText(`地址：${quote.customers.address}`, padding + 16, infoY)
          infoY += 28
        }
        y += 95
      }

      // 商品表格
      ctx.fillStyle = blue500
      ctx.fillRect(padding, y, cardWidth, 44)
      ctx.fillStyle = white
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('商品名称', padding + 100, y + 28)
      ctx.fillText('数量', padding + 280, y + 28)
      ctx.fillText('单价', padding + 360, y + 28)
      ctx.fillText('小计', padding + 440, y + 28)

      y += 44
      ctx.fillStyle = textColor
      ctx.font = '14px sans-serif'

      quote.items.forEach((item) => {
        // 行背景（交替色）
        const index = quote.items.indexOf(item)
        if (index % 2 === 1) {
          ctx.fillStyle = '#F9FAFB'
          ctx.fillRect(padding, y, cardWidth, 44)
        }

        ctx.fillStyle = textColor
        ctx.fillText(item.product_name.substring(0, 15), padding + 100, y + 28)
        ctx.fillText(item.quantity, padding + 280, y + 28)
        ctx.fillText(item.unit_price, padding + 360, y + 28)
        ctx.fillText(item.amount, padding + 440, y + 28)

        y += 44
      })

      // 合计信息
      y += 20
      ctx.fillStyle = gray600
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`小计：¥${quote.subtotal}`, windowWidth - padding, y)
      y += 28
      if (parseFloat(quote.discount) > 0) {
        ctx.fillText(`折扣：-¥${quote.discount}`, windowWidth - padding, y)
        y += 28
      }
      ctx.fillStyle = blue800
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(`总计：¥${quote.total_amount}`, windowWidth - padding, y)

      // 底部信息
      y += 60
      ctx.fillStyle = gray600
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`报价单号：${quote.quote_no}`, windowWidth / 2, y)
      y += 20
      ctx.fillText(`有效期：${quote.valid_days}天`, windowWidth / 2, y)
      y += 20
      const createdDate = new Date(quote.created_at).toLocaleDateString('zh-CN')
      ctx.fillText(`创建日期：${createdDate}`, windowWidth / 2, y)

      // 导出为图片
      const filePath = `${Taro.env.USER_DATA_PATH}/quote_${Date.now()}.png`
      const { tempFilePath } = await Taro.canvasToTempFilePath({
        canvas: canvas,
        width: windowWidth * 2,
        height: 1800 * 2,
        destWidth: windowWidth * 2,
        destHeight: 1800 * 2,
        fileType: 'png',
      })

      console.log('图片生成成功:', tempFilePath)

      // 预览图片
      Taro.previewImage({
        urls: [tempFilePath],
        current: tempFilePath,
      })

      Taro.showModal({
        title: '图片已生成',
        content: '长按图片可保存到相册',
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
      <View className="flex items-center justify-center h-full">
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!quote) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text>报价单不存在</Text>
      </View>
    )
  }

  const statusBadge = getStatusBadge(quote.status)

  return (
    <View className="flex flex-col h-full bg-gray-50">
      <ScrollView className="flex-1" scrollY>
        <View className="p-4 space-y-4">
          {/* 状态卡片 */}
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex justify-between items-center mb-4">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              <Text className="text-sm text-gray-500">报价单号：{quote.quote_no}</Text>
            </View>
            <View className="flex justify-between items-center">
              <Text className="text-sm text-gray-500">创建日期：{new Date(quote.created_at).toLocaleDateString('zh-CN')}</Text>
              <Text className="text-sm text-gray-500">有效期：{quote.valid_days}天</Text>
            </View>
          </View>

          {/* 报价方信息 */}
          {(quote.company_name || quote.contact_person || quote.contact_phone) && (
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-lg font-bold text-blue-800 mb-3 block">报价方信息</Text>
              {quote.company_name && (
                <View className="mb-2">
                  <Text className="text-sm text-gray-600 block">公司名称</Text>
                  <Text className="text-base text-gray-900 block">{quote.company_name}</Text>
                </View>
              )}
              {quote.contact_person && (
                <View className="mb-2">
                  <Text className="text-sm text-gray-600 block">联系人</Text>
                  <Text className="text-base text-gray-900 block">{quote.contact_person}</Text>
                </View>
              )}
              {quote.contact_phone && (
                <View className="mb-2">
                  <Text className="text-sm text-gray-600 block">联系电话</Text>
                  <Text className="text-base text-gray-900 block">{quote.contact_phone}</Text>
                </View>
              )}
              {quote.contact_address && (
                <View className="mb-2">
                  <Text className="text-sm text-gray-600 block">联系地址</Text>
                  <Text className="text-base text-gray-900 block">{quote.contact_address}</Text>
                </View>
              )}
            </View>
          )}

          {/* 客户信息 */}
          {quote.customers && (
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-lg font-bold text-blue-800 mb-3 block">客户信息</Text>
              {quote.customers.name && (
                <View className="mb-2">
                  <Text className="text-sm text-gray-600 block">客户姓名</Text>
                  <Text className="text-base text-gray-900 block">{quote.customers.name}</Text>
                </View>
              )}
              {quote.customers.phone && (
                <View className="mb-2">
                  <Text className="text-sm text-gray-600 block">联系电话</Text>
                  <Text className="text-base text-gray-900 block">{quote.customers.phone}</Text>
                </View>
              )}
              {quote.customers.address && (
                <View className="mb-2">
                  <Text className="text-sm text-gray-600 block">地址</Text>
                  <Text className="text-base text-gray-900 block">{quote.customers.address}</Text>
                </View>
              )}
            </View>
          )}

          {/* 商品列表 */}
          <View className="bg-white rounded-lg shadow-sm overflow-hidden">
            <View className="bg-blue-600 text-white p-3">
              <Text className="font-bold block">商品列表</Text>
            </View>
            <View>
              {quote.items.map((item, index) => (
                <View
                  key={item.id}
                  className={`p-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <View className="flex justify-between items-center">
                    <Text className="flex-1 text-base text-gray-900">{item.product_name}</Text>
                    <Text className="w-20 text-right text-sm text-gray-600">{item.quantity}{item.unit}</Text>
                    <Text className="w-24 text-right text-sm text-gray-600">¥{item.unit_price}</Text>
                    <Text className="w-24 text-right text-base font-bold text-blue-800">¥{item.amount}</Text>
                  </View>
                  {item.remark && (
                    <Text className="text-xs text-gray-500 mt-1 block">备注：{item.remark}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* 合计信息 */}
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">小计</Text>
              <Text className="text-base text-gray-900">¥{quote.subtotal}</Text>
            </View>
            {parseFloat(quote.discount) > 0 && (
              <View className="flex justify-between items-center mb-2">
                <Text className="text-sm text-gray-600">折扣</Text>
                <Text className="text-base text-red-500">-¥{quote.discount}</Text>
              </View>
            )}
            <View className="flex justify-between items-center pt-2 border-t border-gray-200">
              <Text className="text-lg font-bold text-gray-900">总计</Text>
              <Text className="text-2xl font-bold text-blue-800">¥{quote.total_amount}</Text>
            </View>
          </View>

          {/* 备注 */}
          {quote.remark && (
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-lg font-bold text-gray-900 mb-2 block">备注</Text>
              <Text className="text-base text-gray-600">{quote.remark}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      <View className="p-4 bg-white border-t border-gray-200">
        <View className="flex gap-3">
          <Button
            className="flex-1"
            variant="outline"
            onClick={handleCopyLink}
          >
            <View className="flex items-center justify-center gap-2">
              <Copy size={20} color="#6B7280" />
              <Text>复制链接</Text>
            </View>
          </Button>
          <Button
            className="flex-1"
            onClick={handleGenerateImage}
            disabled={generating}
          >
            <View className="flex items-center justify-center gap-2">
              <ImageDown size={20} color={generating ? "#9CA3AF" : "#FFFFFF"} />
              <Text>{generating ? '生成中...' : '生成图片'}</Text>
            </View>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default QuoteDetailPage
