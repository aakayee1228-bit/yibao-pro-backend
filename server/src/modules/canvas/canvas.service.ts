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
   * 生成报价单图片（最简单样式）
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

    // 创建 Canvas（最简单样式，纯白背景）
    const canvas = createCanvas(750, 1400)
    const ctx = canvas.getContext('2d')

    // 纯白色背景
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, 750, 1400)

    // 黑色文字
    const textColor = '#000000'
    const grayColor = '#666666'
    const lineHeight = 40

    let y = 60

    // ========== 标题 ==========
    ctx.fillStyle = textColor
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('报价单', 375, y)

    y += 60

    // ========== 报价单信息 ==========
    ctx.textAlign = 'left'
    ctx.font = '18px sans-serif'

    ctx.fillStyle = grayColor
    ctx.fillText(`报价单号：${quote.quote_no}`, 40, y)
    y += lineHeight

    const dateStr = quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : ''
    ctx.fillText(`日期：${dateStr}`, 40, y)
    y += lineHeight

    ctx.fillText(`有效期：${quote.valid_days} 天`, 40, y)
    y += 60

    // ========== 分隔线 ==========
    ctx.strokeStyle = '#CCCCCC'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(710, y)
    ctx.stroke()
    y += 40

    // ========== 客户信息 ==========
    const customerName = quote.customers?.name || '未命名'
    ctx.fillStyle = textColor
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText(`客户：${customerName}`, 40, y)
    y += lineHeight

    ctx.font = '18px sans-serif'
    if (quote.customers?.company) {
      ctx.fillStyle = grayColor
      ctx.fillText(`公司：${quote.customers.company}`, 40, y)
      y += lineHeight
    }

    if (quote.customers?.phone) {
      ctx.fillText(`电话：${quote.customers.phone}`, 40, y)
      y += lineHeight
    }

    if (quote.customers?.address) {
      ctx.fillText(`地址：${quote.customers.address}`, 40, y)
      y += lineHeight
    }

    y += 40

    // ========== 分隔线 ==========
    ctx.strokeStyle = '#CCCCCC'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(710, y)
    ctx.stroke()
    y += 50

    // ========== 表格标题 ==========
    ctx.fillStyle = textColor
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('商品明细', 40, y)
    y += 40

    // ========== 表头 ==========
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('品名', 40, y)
    ctx.fillText('单位', 300, y)
    ctx.fillText('数量', 400, y)
    ctx.fillText('单价', 500, y)
    ctx.fillText('金额', 620, y)

    y += 30

    // ========== 分隔线 ==========
    ctx.strokeStyle = '#CCCCCC'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(710, y)
    ctx.stroke()
    y += 40

    // ========== 表格内容 ==========
    ctx.font = '16px sans-serif'

    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item, index) => {
        if (index >= 10) return // 最多显示10条

        ctx.fillStyle = textColor
        ctx.fillText(item.product_name, 40, y)
        ctx.fillText(item.unit, 300, y)
        ctx.fillText(item.quantity, 400, y)
        ctx.fillText(`¥${Number(item.unit_price).toFixed(2)}`, 500, y)
        ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, 620, y)

        y += lineHeight

        // 分隔线
        ctx.strokeStyle = '#DDDDDD'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(40, y)
        ctx.lineTo(710, y)
        ctx.stroke()
        y += 40
      })
    }

    // ========== 金额汇总 ==========
    y += 20

    ctx.font = '18px sans-serif'
    ctx.fillStyle = grayColor
    ctx.textAlign = 'right'

    ctx.fillText('商品金额：', 710, y)
    y += lineHeight

    if (Number(quote.discount) > 0) {
      ctx.fillText(`优惠金额：-¥${Number(quote.discount).toFixed(2)}`, 710, y)
      y += lineHeight
    }

    ctx.fillStyle = textColor
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText(`合计金额：¥${Number(quote.total_amount).toFixed(2)}`, 710, y)
    y += 60

    // ========== 备注 ==========
    if (quote.remark) {
      y += 20
      ctx.strokeStyle = '#CCCCCC'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, y)
      ctx.lineTo(710, y)
      ctx.stroke()
      y += 40

      ctx.fillStyle = textColor
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('备注：', 40, y)
      y += 30

      ctx.font = '16px sans-serif'
      ctx.fillStyle = grayColor
      ctx.fillText(quote.remark, 40, y)
      y += lineHeight
    }

    // ========== 底部说明 ==========
    y += 40
    ctx.strokeStyle = '#CCCCCC'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(710, y)
    ctx.stroke()
    y += 40

    ctx.fillStyle = grayColor
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('此报价单仅供参考，请以实际交易为准', 375, y)

    // 转换为 Buffer
    return canvas.toBuffer('image/png')
  }
}
