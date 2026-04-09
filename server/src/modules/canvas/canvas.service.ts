import { Injectable, BadRequestException } from '@nestjs/common'
import { createCanvas } from '@napi-rs/canvas'
import { getSupabaseClient } from '@/storage/database/supabase-client'

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

@Injectable()
export class CanvasService {

  /**
   * 生成报价单图片
   */
  async generateQuoteImage(quoteId: string): Promise<Buffer> {
    const client = getSupabaseClient()

    // 查询报价单数据
    const { data: quotesData, error: quoteError } = await client
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quotesData) {
      throw new BadRequestException('报价单不存在')
    }

    // 查询客户信息
    const { data: customersData } = await client
      .from('customers')
      .select('*')
      .eq('id', quotesData.customer_id)
      .single()

    const customer = customersData || null

    // 查询商品明细
    const { data: itemsData } = await client
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)

    const quote: Quote = {
      id: quotesData.id,
      quote_no: quotesData.quote_no,
      customer_id: quotesData.customer_id,
      status: quotesData.status,
      subtotal: quotesData.subtotal,
      discount: quotesData.discount,
      total_amount: quotesData.total_amount,
      remark: quotesData.remark,
      valid_days: quotesData.valid_days,
      created_at: quotesData.created_at,
      customers: customer,
      items: itemsData || [],
    }

    // 创建 Canvas
    const canvas = createCanvas(750, 1400)
    const ctx = canvas.getContext('2d')

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
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('产品报价单', 375, 78)

    // ========== 两列信息布局 ==========
    let yPos = 140
    ctx.font = '24px sans-serif'

    // 左列 - 客户信息
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'left'
    const customerName = quote.customers?.name || '客户'
    ctx.fillText(`客户：${customerName}`, 30, yPos)

    if (quote.customers?.company) {
      yPos += 40
      ctx.fillStyle = '#6b7280'
      ctx.font = '24px sans-serif'
      ctx.fillText(quote.customers.company, 30, yPos)
    }

    if (quote.customers?.phone) {
      yPos += 40
      ctx.fillText(`电话：${quote.customers.phone}`, 30, yPos)
    }

    // 右列 - 表单信息
    yPos = 140
    ctx.fillStyle = '#6b7280'
    ctx.font = '24px sans-serif'
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

    // 表头背景
    ctx.fillStyle = '#1e40af'
    ctx.fillRect(20, yPos, 710, 50)

    // 表头文字
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('序号', 60, yPos + 34)
    ctx.fillText('品名', 240, yPos + 34)
    ctx.fillText('单位', 400, yPos + 34)
    ctx.fillText('数量', 480, yPos + 34)
    ctx.fillText('单价', 560, yPos + 34)
    ctx.fillText('合计', 680, yPos + 34)

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
        ctx.font = '22px sans-serif'
        ctx.textAlign = 'center'

        // 序号
        ctx.fillText(String(index + 1), 60, yPos + 32)

        // 品名
        ctx.textAlign = 'left'
        ctx.fillText(item.product_name, 100, yPos + 32)

        // 单位
        ctx.textAlign = 'center'
        ctx.fillText(item.unit, 400, yPos + 32)

        // 数量
        ctx.fillText(item.quantity, 480, yPos + 32)

        // 单价
        ctx.fillText(`¥${Number(item.unit_price).toFixed(2)}`, 560, yPos + 32)

        // 合计
        ctx.fillStyle = '#1e40af'
        ctx.font = 'bold 22px sans-serif'
        ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, 680, yPos + 32)

        yPos += 50
      })
    }

    // ========== 金额汇总区域 ==========
    yPos += 20

    // 绘制金额汇总表格
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.strokeRect(400, yPos, 330, 160)

    // 商品金额
    yPos += 40
    ctx.fillStyle = '#6b7280'
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('商品金额', 700, yPos)
    ctx.fillStyle = '#374151'
    ctx.fillText(`¥${Number(quote.subtotal).toFixed(2)}`, 710, yPos)

    // 优惠金额
    if (Number(quote.discount) > 0) {
      yPos += 40
      ctx.fillStyle = '#ef4444'
      ctx.textAlign = 'right'
      ctx.fillText('优惠金额', 700, yPos)
      ctx.fillText(`-¥${Number(quote.discount).toFixed(2)}`, 710, yPos)
    }

    // 合计金额
    yPos += 50
    ctx.strokeStyle = '#e5e7eb'
    ctx.beginPath()
    ctx.moveTo(410, yPos)
    ctx.lineTo(720, yPos)
    ctx.stroke()

    yPos += 45
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('合计', 700, yPos)
    ctx.fillStyle = '#1e40af'
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText(`¥${Number(quote.total_amount).toFixed(2)}`, 710, yPos)

    // ========== 备注 ==========
    if (quote.remark) {
      yPos = yPos + 60
      ctx.fillStyle = '#9ca3af'
      ctx.font = '22px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`备注：${quote.remark}`, 30, yPos)
    }

    // ========== 底部说明 ==========
    yPos = 1350
    ctx.fillStyle = '#9ca3af'
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('此报价单仅供参考，请以实际交易为准', 375, yPos)

    // ========== 绘制水印 ==========
    const watermarkText = `仅供 ${customerName}${quote.customers?.company ? ' / ' + quote.customers.company : ''} 参考`

    ctx.save()
    ctx.globalAlpha = 0.12
    ctx.fillStyle = '#1e40af'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 3; col++) {
        const x = 150 + col * 280
        const y = 400 + row * 150

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(-30 * Math.PI / 180)
        ctx.fillText(watermarkText, 0, 0)
        ctx.restore()
      }
    }
    ctx.restore()

    // 转换为 Buffer
    return canvas.toBuffer('image/png')
  }
}
