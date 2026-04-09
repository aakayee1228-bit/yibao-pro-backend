import { View, Text, ScrollView, Canvas } from '@tarojs/components'
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
  customers: Customer | null
  items: QuoteItem[]
}

const QuoteDetailPage: FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [userName, setUserName] = useState<string>('用户') // 添加用户名称状态

  useDidShow(() => {
    const id = Taro.getCurrentInstance().router?.params?.id
    if (id) {
      fetchQuoteDetail(id)
    }

    // 获取用户信息
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (userInfo && userInfo.name) {
        setUserName(userInfo.name)
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
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
      canvas.height = 1400 * dpr
      ctx.scale(dpr, dpr)

      // 清除画布
      ctx.clearRect(0, 0, 750, 1400)

      // 绘制白色背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 750, 1400)

      // ========== 顶部蓝色标题区域 ==========
      const gradient = ctx.createLinearGradient(0, 0, 750, 0)
      gradient.addColorStop(0, '#1e40af')
      gradient.addColorStop(1, '#3b82f6')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 750, 120)

      // 标题
      ctx.save() // 保存状态
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 48px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('产品报价单', 375, 60)
      ctx.restore() // 恢复状态

      // ========== 两列信息布局 ==========
      let yPos = 140
      ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif'

      // 左列 - 客户信息
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      const customerName = quote.customers?.name || '客户'
      ctx.fillText(`客户：${customerName}`, 30, yPos)

      if (quote.customers?.company) {
        yPos += 40
        ctx.fillStyle = '#6b7280'
        ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif'
        ctx.fillText(quote.customers.company, 30, yPos)
      }

      if (quote.customers?.phone) {
        yPos += 40
        ctx.fillText(`电话：${quote.customers.phone}`, 30, yPos)
      }

      // 右列 - 表单信息
      yPos = 140
      ctx.fillStyle = '#6b7280'
      ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`单号：${quote.quote_no}`, 720, yPos)

      yPos += 40
      const dateStr = quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : ''
      ctx.fillText(`日期：${dateStr}`, 720, yPos)

      yPos += 40
      ctx.fillText(`有效期：${quote.valid_days} 天`, 720, yPos)

      // ========== 水平分隔线 ==========
      yPos += 60
      ctx.strokeStyle = '#1e40af'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(20, yPos)
      ctx.lineTo(730, yPos)
      ctx.stroke()

      // ========== 商品明细表格 ==========
      yPos += 10

      // 定义列宽
      const colWidths = {
        index: 80,    // 序号
        name: 200,    // 品名
        unit: 80,     // 单位
        quantity: 80, // 数量
        price: 100,   // 单价
        total: 170    // 合计
      }

      // 计算列的起始位置
      const colX = {
        index: 30,
        name: 30 + colWidths.index,
        unit: 30 + colWidths.index + colWidths.name,
        quantity: 30 + colWidths.index + colWidths.name + colWidths.unit,
        price: 30 + colWidths.index + colWidths.name + colWidths.unit + colWidths.quantity,
        total: 30 + colWidths.index + colWidths.name + colWidths.unit + colWidths.quantity + colWidths.price
      }

      // 表头背景
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(20, yPos, 710, 50)

      // 表头文字
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('序号', colX.index + colWidths.index / 2, yPos + 25)
      ctx.fillText('品名', colX.name + colWidths.name / 2, yPos + 25)
      ctx.fillText('单位', colX.unit + colWidths.unit / 2, yPos + 25)
      ctx.fillText('数量', colX.quantity + colWidths.quantity / 2, yPos + 25)
      ctx.fillText('单价', colX.price + colWidths.price / 2, yPos + 25)
      ctx.fillText('合计', colX.total + colWidths.total / 2, yPos + 25)

      // 表格边框
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.strokeRect(20, yPos, 710, 50)

      yPos += 50

      // 表格内容
      if (quote.items && quote.items.length > 0) {
        quote.items.forEach((item, index) => {
          if (index >= 8) return

          // 绘制行背景
          if (index % 2 === 0) {
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(20, yPos, 710, 50)
          }

          // 绘制单元格边框
          ctx.strokeStyle = '#e5e7eb'
          ctx.strokeRect(20, yPos, 710, 50)

          // 绘制文字
          ctx.fillStyle = '#374151'
          ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          // 序号
          ctx.fillText(String(index + 1), colX.index + colWidths.index / 2, yPos + 25)

          // 品名（左对齐，带截断）
          ctx.textAlign = 'left'
          let productName = item.product_name
          const maxChars = 10 // 最多显示10个字符
          if (productName.length > maxChars) {
            productName = productName.substring(0, maxChars) + '...'
          }
          ctx.fillText(productName, colX.name + 10, yPos + 25)

          // 单位
          ctx.textAlign = 'center'
          ctx.fillText(item.unit, colX.unit + colWidths.unit / 2, yPos + 25)

          // 数量
          ctx.fillText(item.quantity, colX.quantity + colWidths.quantity / 2, yPos + 25)

          // 单价
          ctx.fillText(`¥${Number(item.unit_price).toFixed(2)}`, colX.price + colWidths.price / 2, yPos + 25)

          // 合计
          ctx.fillStyle = '#1e40af'
          ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
          ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, colX.total + colWidths.total / 2, yPos + 25)

          yPos += 50
        })
      }

      // ========== 金额汇总区域 ==========
      yPos += 20

      // 绘制金额汇总表格
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.strokeRect(420, yPos, 310, 160)

      const summaryLabelX = 680
      const summaryValueX = 720

      // 商品金额
      yPos += 40
      ctx.fillStyle = '#6b7280'
      ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('商品金额', summaryLabelX, yPos)
      ctx.fillStyle = '#374151'
      ctx.fillText(`¥${Number(quote.subtotal).toFixed(2)}`, summaryValueX, yPos)

      // 优惠金额
      if (Number(quote.discount) > 0) {
        yPos += 40
        ctx.fillStyle = '#ef4444'
        ctx.textAlign = 'right'
        ctx.fillText('优惠金额', summaryLabelX, yPos)
        ctx.fillText(`-¥${Number(quote.discount).toFixed(2)}`, summaryValueX, yPos)
      }

      // 合计金额
      yPos += 50
      ctx.strokeStyle = '#e5e7eb'
      ctx.beginPath()
      ctx.moveTo(430, yPos)
      ctx.lineTo(730, yPos)
      ctx.stroke()

      yPos += 45
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('合计', summaryLabelX, yPos)
      ctx.fillStyle = '#1e40af'
      ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(`¥${Number(quote.total_amount).toFixed(2)}`, summaryValueX, yPos)

      // ========== 备注 ==========
      if (quote.remark) {
        yPos += 60
        ctx.fillStyle = '#9ca3af'
        ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'

        // 处理备注换行
        const remark = `备注：${quote.remark}`
        const maxWidth = 700
        const words = remark.split('')
        let line = ''
        let remarkYPos = yPos

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i]
          const metrics = ctx.measureText(testLine)

          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, 30, remarkYPos)
            line = words[i]
            remarkYPos += 30
          } else {
            line = testLine
          }
        }
        ctx.fillText(line, 30, remarkYPos)
      }

      // ========== 底部说明 ==========
      const footerYPos = 1350
      ctx.fillStyle = '#9ca3af'
      ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('此报价单仅供参考，请以实际交易为准', 375, footerYPos)

      // ========== 绘制水印 ==========
      // 使用用户登录名称而不是客户名称
      const watermarkText = `仅供 ${userName} 参考`

      ctx.save()
      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#1e40af'
      ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 3; col++) {
          const x = 150 + col * 280
          const y = 400 + row * 150

          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(-30 * Math.PI / 180)
          // 确保水印文字在旋转后不会超出画布边界
          ctx.fillText(watermarkText, 0, 0)
          ctx.restore()
        }
      }
      ctx.restore()

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
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '750px', height: '1400px' }}
      />

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
