import { View, Text, ScrollView, Canvas } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Phone, Share2, Copy, ImageDown } from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  // 生成带水印的图片
  const handleGenerateImage = async () => {
    if (!quote) return

    setGenerating(true)
    try {
      // 使用 Taro.createSelectorQuery 获取 canvas 节点
      const query = Taro.createSelectorQuery()
      const nodes = await new Promise<Taro.NodesRef.Fields[]>((resolve) => {
        query.select('#quoteCanvas')
          .fields({ node: true, size: true })
          .exec((data) => {
            resolve(data)
          })
      })

      if (!nodes || !nodes[0]) {
        throw new Error('Canvas 节点获取失败')
      }

      const node = nodes[0].node
      if (!node) {
        throw new Error('Canvas node 不存在')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = node as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = canvas.getContext('2d') as any

      if (!ctx) {
        throw new Error('无法获取 Canvas 上下文')
      }

      // 设置 canvas 尺寸
      const dpr = Taro.getSystemInfoSync().pixelRatio
      canvas.width = 750 * dpr
      canvas.height = 1200 * dpr
      ctx.scale(dpr, dpr)

      // 绘制背景
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, 750, 1200)

      // 绘制顶部蓝色区域
      const gradient = ctx.createLinearGradient(0, 0, 750, 0)
      gradient.addColorStop(0, '#2563eb')
      gradient.addColorStop(1, '#3b82f6')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 750, 180)

      // 标题
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 40px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('易 表 单', 375, 70)

      // 单号
      ctx.font = '28px sans-serif'
      ctx.fillText(quote.quote_no, 375, 120)

      // 日期
      ctx.font = '22px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      const dateStr = quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : ''
      ctx.fillText(dateStr, 375, 155)

      // 白色卡片背景
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, 20, 200, 710, 900, 16)
      ctx.fill()

      // 客户信息
      let yPos = 250
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'left'
      const customerName = quote.customers?.name || '客户'
      ctx.fillText(`客户：${customerName}`, 50, yPos)

      if (quote.customers?.company) {
        yPos += 40
        ctx.fillStyle = '#6b7280'
        ctx.font = '24px sans-serif'
        ctx.fillText(quote.customers.company, 50, yPos)
      }

      // 分割线
      yPos += 50
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(50, yPos)
      ctx.lineTo(700, yPos)
      ctx.stroke()

      // 商品明细标题
      yPos += 45
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText('商品明细', 50, yPos)

      // 商品列表
      yPos += 40
      ctx.font = '24px sans-serif'

      if (quote.items && quote.items.length > 0) {
        quote.items.forEach((item, index) => {
          if (index >= 8) return

          ctx.fillStyle = '#374151'
          ctx.fillText(item.product_name, 50, yPos)

          ctx.fillStyle = '#6b7280'
          const qtyPrice = `${item.quantity}${item.unit} × ¥${Number(item.unit_price).toFixed(2)}`
          ctx.fillText(qtyPrice, 50, yPos + 32)

          ctx.fillStyle = '#2563eb'
          ctx.textAlign = 'right'
          ctx.font = 'bold 26px sans-serif'
          ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, 700, yPos + 16)
          ctx.textAlign = 'left'
          ctx.font = '24px sans-serif'

          yPos += 80
        })
      }

      // 分割线
      yPos += 10
      ctx.strokeStyle = '#e5e7eb'
      ctx.beginPath()
      ctx.moveTo(50, yPos)
      ctx.lineTo(700, yPos)
      ctx.stroke()

      // 合计
      yPos += 50
      ctx.fillStyle = '#6b7280'
      ctx.font = '26px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('商品金额', 50, yPos)
      ctx.textAlign = 'right'
      ctx.fillText(`¥${Number(quote.subtotal).toFixed(2)}`, 700, yPos)

      if (Number(quote.discount) > 0) {
        yPos += 40
        ctx.fillStyle = '#ef4444'
        ctx.textAlign = 'left'
        ctx.fillText('优惠金额', 50, yPos)
        ctx.textAlign = 'right'
        ctx.fillText(`-¥${Number(quote.discount).toFixed(2)}`, 700, yPos)
      }

      // 总计
      yPos += 60
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('合计', 50, yPos)
      ctx.fillStyle = '#2563eb'
      ctx.textAlign = 'right'
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText(`¥${Number(quote.total_amount).toFixed(2)}`, 700, yPos)

      // 有效期
      yPos += 50
      ctx.fillStyle = '#9ca3af'
      ctx.font = '22px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`有效期：${quote.valid_days} 天`, 50, yPos)

      // ========== 绘制水印 ==========
      const watermarkText = `仅供 ${customerName}${quote.customers?.company ? ' / ' + quote.customers.company : ''} 参考`

      ctx.save()
      ctx.globalAlpha = 0.15
      ctx.fillStyle = '#2563eb'
      ctx.font = 'bold 36px sans-serif'
      ctx.textAlign = 'center'

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 3; col++) {
          const x = 150 + col * 280
          const y = 300 + row * 150

          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(-30 * Math.PI / 180)
          ctx.fillText(watermarkText, 0, 0)
          ctx.restore()
        }
      }
      ctx.restore()

      // 底部提示
      ctx.fillStyle = '#9ca3af'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('此表单仅供参考，请以实际交易为准', 375, 1150)

      // 导出图片
      Taro.canvasToTempFilePath({
        canvas: canvas,
        success: (res) => {
          // 预览图片
          Taro.previewImage({
            urls: [res.tempFilePath],
            current: res.tempFilePath,
          })

          // 显示操作提示
          Taro.showModal({
            title: '图片已生成',
            content: '长按图片可保存到相册，或点击右上角分享给客户',
            showCancel: false,
            confirmText: '知道了',
          })
        },
        fail: (err) => {
          console.error('生成图片失败:', err)
          Taro.showToast({ title: '生成失败', icon: 'none' })
        },
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
      {/* 隐藏的 Canvas 用于生成图片 */}
      <Canvas
        id="quoteCanvas"
        type="2d"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '750px', height: '1200px' }}
      />

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
        <View className="flex items-center gap-2">
          <View
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg bg-gray-100"
            onClick={handleCopyLink}
          >
            <Copy size={16} color="#374151" />
            <Text className="text-sm text-gray-700">复制</Text>
          </View>
          <View
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg bg-green-500"
            onClick={handleGenerateImage}
          >
            <ImageDown size={16} color="#ffffff" />
            <Text className="text-sm text-white">{generating ? '生成中...' : '生成图片'}</Text>
          </View>
          <Button
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg bg-blue-500 text-white"
            openType="share"
          >
            <Share2 size={16} color="#ffffff" />
            <Text className="text-sm text-white">分享</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

// 绘制圆角矩形
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export default QuoteDetailPage
