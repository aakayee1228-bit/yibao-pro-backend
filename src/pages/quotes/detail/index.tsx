import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Phone, Share2, Copy } from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  customers: Customer | null
  items: QuoteItem[]
}

const QuoteDetailPage: FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)

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
      // 不指定imageUrl，微信会自动截取当前页面作为分享图
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

  // 分享给客户 - 触发微信分享菜单
  const handleShare = () => {
    // 小程序端触发分享
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      Taro.showShareMenu({
        withShareTicket: true,
      } as Taro.showShareMenu.Option)
    } else {
      // H5端提示
      Taro.showToast({
        title: '请在微信小程序中使用分享功能',
        icon: 'none',
      })
    }
  }

  // 复制分享链接（备用方案）
  const handleCopyLink = () => {
    if (!quote) return

    const customerName = quote.customers?.name || '客户'
    const amount = Number(quote.total_amount).toFixed(2)

    Taro.setClipboardData({
      data: `【易表单】${customerName} 您好，这是您的表单：\n单号：${quote.quote_no}\n金额：¥${amount}\n\n请在微信中搜索「易表单」小程序查看详情。`,
    })
    Taro.showToast({ title: '已复制分享文案', icon: 'success' })
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
          {/* 基本信息 */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <View className="flex items-center justify-between">
                <CardTitle className="text-base">表单信息</CardTitle>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </View>
            </CardHeader>
            <CardContent className="pt-0">
              <View className="flex flex-col gap-2">
                <View className="flex items-center justify-between">
                  <Text className="text-sm text-gray-500">单号</Text>
                  <Text className="text-sm text-gray-900">{quote.quote_no}</Text>
                </View>
                <View className="flex items-center justify-between">
                  <Text className="text-sm text-gray-500">创建时间</Text>
                  <Text className="text-sm text-gray-900">
                    {quote.created_at ? new Date(quote.created_at).toLocaleString('zh-CN') : '-'}
                  </Text>
                </View>
                <View className="flex items-center justify-between">
                  <Text className="text-sm text-gray-500">有效期</Text>
                  <Text className="text-sm text-gray-900">{quote.valid_days} 天</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 客户信息 */}
          {quote.customers && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">客户信息</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-base font-medium text-gray-900">{quote.customers.name}</Text>
                  <View className="flex items-center">
                    <Phone size={14} color="#2563eb" />
                    <Text className="text-sm text-blue-500 ml-1">{quote.customers.phone}</Text>
                  </View>
                </View>
                {quote.customers.company && (
                  <Text className="text-sm text-gray-500">{quote.customers.company}</Text>
                )}
                {quote.customers.address && (
                  <Text className="text-xs text-gray-400 mt-1">{quote.customers.address}</Text>
                )}
              </CardContent>
            </Card>
          )}

          {/* 商品明细 */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">商品明细</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {quote.items && quote.items.length > 0 ? (
                <View className="flex flex-col gap-3">
                  {quote.items.map((item, index) => (
                    <View key={item.id || index} className="pb-3 border-b border-gray-100 last:border-0">
                      <View className="flex items-center justify-between mb-1">
                        <Text className="text-sm font-medium text-gray-900">{item.product_name}</Text>
                        <Text className="text-sm font-bold text-blue-600">¥{Number(item.amount).toFixed(2)}</Text>
                      </View>
                      <View className="flex items-center gap-2 text-xs text-gray-500">
                        <Text>{item.quantity} {item.unit}</Text>
                        <Text>×</Text>
                        <Text>¥{Number(item.unit_price).toFixed(2)}</Text>
                        {Number(item.discount) > 0 && (
                          <>
                            <Text>-</Text>
                            <Text className="text-red-500">¥{Number(item.discount).toFixed(2)}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-gray-400 text-center py-4">暂无商品</Text>
              )}
            </CardContent>
          </Card>

          {/* 合计信息 */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-2">
                <Text className="text-sm text-gray-500">商品金额</Text>
                <Text className="text-sm text-gray-900">¥{Number(quote.subtotal).toFixed(2)}</Text>
              </View>
              {Number(quote.discount) > 0 && (
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-gray-500">优惠金额</Text>
                  <Text className="text-sm text-red-500">-¥{Number(quote.discount).toFixed(2)}</Text>
                </View>
              )}
              <View className="border-t border-gray-100 pt-2 mt-2">
                <View className="flex items-center justify-between">
                  <Text className="text-base font-medium text-gray-900">合计金额</Text>
                  <Text className="text-xl font-bold text-blue-600">¥{Number(quote.total_amount).toFixed(2)}</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 备注 */}
          {quote.remark && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">备注</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Text className="text-sm text-gray-600">{quote.remark}</Text>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <View className="flex items-center gap-3">
          <View
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-gray-100"
            onClick={handleCopyLink}
          >
            <Copy size={16} color="#374151" />
            <Text className="text-sm text-gray-700">复制文案</Text>
          </View>
          <View
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-500"
            onClick={handleShare}
          >
            <Share2 size={18} color="#ffffff" />
            <Text className="text-sm text-white">发送给客户</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default QuoteDetailPage
