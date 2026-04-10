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
   * 生成报价单图片（参考样式：浅灰色背景卡片）
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

    // 字体配置（使用中文字体）
    const fontFamily = '"WenQuanYi Micro Hei", "文泉驿微米黑", sans-serif'

    // 配色方案（参考样式）
    const backgroundColor = '#FFFFFF'  // 整体白色背景
    const cardBackgroundColor = '#ECECEC'  // 内容卡片浅灰色背景（236,236,236）
    const textColor = '#000000'      // 黑色文字
    const grayColor = '#666666'      // 灰色文字
    const lineHeight = 40            // 行高
    const cardPadding = 20           // 卡片内边距

    // 纯白色背景
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, 750, 1400)

    let y = 60

    // ========== 标题 ==========
    ctx.fillStyle = textColor
    ctx.font = `bold 36px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillText('报价单', 375, y)

    y += 60

    // ========== 报价单信息卡片 ==========
    const infoCardStart = y
    ctx.fillStyle = cardBackgroundColor
    ctx.fillRect(50, infoCardStart, 650, 130)  // 浅灰色背景卡片

    y += 30
    ctx.textAlign = 'left'
    ctx.font = `16px ${fontFamily}`

    ctx.fillStyle = textColor
    ctx.fillText(`报价单号：${quote.quote_no}`, 70, y)
    y += lineHeight

    const dateStr = quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : ''
    ctx.fillText(`日期：${dateStr}`, 70, y)
    y += lineHeight

    ctx.fillText(`有效期：${quote.valid_days} 天`, 70, y)

    y += 50

    // ========== 客户信息卡片 ==========
    const customerCardStart = y
    const customerCardHeight = 180
    ctx.fillStyle = cardBackgroundColor
    ctx.fillRect(50, customerCardStart, 650, customerCardHeight)

    y += 30
    const customerName = quote.customers?.name || '未命名'
    ctx.fillStyle = textColor
    ctx.font = `bold 20px ${fontFamily}`
    ctx.fillText(`客户：${customerName}`, 70, y)
    y += lineHeight

    ctx.font = `16px ${fontFamily}`
    if (quote.customers?.company) {
      ctx.fillStyle = textColor
      ctx.fillText(`公司：${quote.customers.company}`, 70, y)
      y += lineHeight
    }

    if (quote.customers?.phone) {
      ctx.fillStyle = textColor
      ctx.fillText(`电话：${quote.customers.phone}`, 70, y)
      y += lineHeight
    }

    if (quote.customers?.address) {
      ctx.fillStyle = textColor
      ctx.fillText(`地址：${quote.customers.address}`, 70, y)
      y += lineHeight
    }

    y += 30

    // ========== 商品明细卡片 ==========
    const productCardStart = y
    const productCardHeight = 500  // 预估高度
    ctx.fillStyle = cardBackgroundColor
    ctx.fillRect(50, productCardStart, 650, productCardHeight)

    y += 30
    ctx.fillStyle = textColor
    ctx.font = `bold 20px ${fontFamily}`
    ctx.fillText('商品明细', 70, y)
    y += 40

    // ========== 表头 ==========
    ctx.font = `bold 14px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.fillText('品名', 70, y)
    ctx.fillText('单位', 320, y)
    ctx.fillText('数量', 420, y)
    ctx.fillText('单价', 520, y)
    ctx.fillText('金额', 600, y)

    y += 30

    // 表头分隔线
    ctx.fillStyle = '#CCCCCC'
    ctx.fillRect(70, y, 610, 1)
    y += 30

    // ========== 表格内容 ==========
    ctx.font = `14px ${fontFamily}`

    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item, index) => {
        if (index >= 10) return // 最多显示10条

        ctx.fillStyle = textColor
        ctx.fillText(item.product_name, 70, y)
        ctx.fillText(item.unit, 320, y)
        ctx.fillText(item.quantity, 420, y)
        ctx.fillText(`¥${Number(item.unit_price).toFixed(2)}`, 520, y)
        ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, 600, y)

        y += lineHeight

        // 每行分隔线
        ctx.fillStyle = '#DDDDDD'
        ctx.fillRect(70, y, 610, 1)
        y += 30
      })
    }

    y += 20

    // ========== 金额汇总卡片 ==========
    const amountCardStart = y
    const amountCardHeight = 130
    ctx.fillStyle = cardBackgroundColor
    ctx.fillRect(50, amountCardStart, 650, amountCardHeight)

    y += 30
    ctx.font = `16px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.textAlign = 'right'

    ctx.fillText('商品金额：', 650, y)
    y += lineHeight

    if (Number(quote.discount) > 0) {
      ctx.fillText(`优惠金额：-¥${Number(quote.discount).toFixed(2)}`, 650, y)
      y += lineHeight
    }

    ctx.fillStyle = textColor
    ctx.font = `bold 20px ${fontFamily}`
    ctx.fillText(`合计金额：¥${Number(quote.total_amount).toFixed(2)}`, 650, y)

    y += 30

    // ========== 备注（如果有）==========
    if (quote.remark) {
      y += 20
      const remarkCardStart = y
      const remarkCardHeight = 100
      ctx.fillStyle = cardBackgroundColor
      ctx.fillRect(50, remarkCardStart, 650, remarkCardHeight)

      y += 30
      ctx.fillStyle = textColor
      ctx.font = `bold 16px ${fontFamily}`
      ctx.textAlign = 'left'
      ctx.fillText('备注：', 70, y)
      y += 30

      ctx.font = `14px ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.fillText(quote.remark, 70, y)
      y += lineHeight
    }

    // ========== 底部说明 ==========
    y += 40
    ctx.fillStyle = textColor
    ctx.font = `12px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillText('此报价单仅供参考，请以实际交易为准', 375, y)

    // 转换为 Buffer
    return canvas.toBuffer('image/png')
  }
}
