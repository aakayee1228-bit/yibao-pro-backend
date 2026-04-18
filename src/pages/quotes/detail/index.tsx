import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Copy, FileDown } from 'lucide-react-taro'
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

  // 生成 PDF
  const handleGeneratePDF = async () => {
    if (!quote) return

    setGenerating(true)
    try {
      console.log('开始生成PDF，报价单ID:', quote.id)

      // 调用后端接口生成 PDF
      const res = await Network.request({
        url: `/api/canvas/quote/${quote.id}`,
        method: 'GET',
      })

      console.log('生成PDF响应:', res.statusCode, res.data)

      if (res.statusCode !== 200 || !res.data || !res.data.data) {
        throw new Error('生成PDF失败')
      }

      const { base64 } = res.data.data as { base64: string; size: number }
      console.log('PDF生成成功，Base64长度:', base64.length)

      // 转换 Base64 为 ArrayBuffer
      const arrayBuffer = Taro.base64ToArrayBuffer(base64)

      // 写入临时文件
      const tempFilePath = await new Promise<string>((resolve, reject) => {
        const fs = Taro.getFileSystemManager()
        const tempPath = `${Taro.env.USER_DATA_PATH}/quote_${quote.id}_${Date.now()}.pdf`

        try {
          fs.writeFile({
            filePath: tempPath,
            data: arrayBuffer,
            encoding: 'binary',
            success: () => {
              console.log('PDF写入成功:', tempPath)
              resolve(tempPath)
            },
            fail: (err) => {
              console.error('PDF写入失败:', err)
              reject(err)
            },
          })
        } catch (err) {
          console.error('PDF写入异常:', err)
          reject(err)
        }
      })

      // 打开文档
      await Taro.openDocument({
        filePath: tempFilePath,
        fileType: 'pdf',
        showMenu: true,
      })

      Taro.showToast({ title: 'PDF已生成', icon: 'success' })
    } catch (err) {
      console.error('生成PDF异常:', err)
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
            onClick={handleGeneratePDF}
            disabled={generating}
          >
            <View className="flex items-center justify-center gap-2">
              <FileDown size={20} color={generating ? "#9CA3AF" : "#FFFFFF"} />
              <Text>{generating ? '生成中...' : '生成PDF'}</Text>
            </View>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default QuoteDetailPage
