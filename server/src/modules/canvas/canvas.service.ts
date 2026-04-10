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
  company_name?: string
  contact_person?: string
  contact_phone?: string
  contact_address?: string
  contact_email?: string
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
      company_name: quotesData.company_name,
      contact_person: quotesData.contact_person,
      contact_phone: quotesData.contact_phone,
      contact_address: quotesData.contact_address,
      contact_email: quotesData.contact_email,
      customers: customer,
      items: itemsData || [],
    }

    // 创建 Canvas
    const canvas = createCanvas(750, 1600)
    const ctx = canvas.getContext('2d')

    // 字体配置（使用中文字体）
    const fontFamily = '"WenQuanYi Micro Hei", "文泉驿微米黑", sans-serif'

    // 配色方案（参考样式）
    const backgroundColor = '#FFFFFF'  // 整体白色背景
    const cardBackgroundColor = '#ECECEC'  // 内容卡片浅灰色背景（236,236,236）
    const cardBorderColor = '#B0B0B0'   // 卡片边框（176,176,176）- 更深一点
    const gridColor = '#B0B0B0'         // 格子线 - 更深一点
    const textColor = '#000000'      // 黑色文字
    const grayColor = '#666666'      // 灰色文字
    const lineHeight = 40            // 行高
    const cardPadding = 20           // 卡片内边距
    const borderWidth = 2            // 边框宽度 - 增加到2px

    // 纯白色背景
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, 750, 1400)

    let y = 60

    // ========== 标题 ==========
    ctx.fillStyle = textColor
    ctx.font = `bold 36px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillText('报价单', 375, y)

    y += 80

    // ========== 报价单号、日期、有效期（白色背景，无灰色背景）==========
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

    // ========== 报价方信息卡片（灰色背景 + 加粗标题）==========
    if (quote.company_name || quote.contact_person || quote.contact_phone) {
      const quoteInfoCardStart = y
      const quoteInfoCardWidth = 650
      const quoteInfoCardHeight = 200

      // 浅灰色背景卡片
      ctx.fillStyle = cardBackgroundColor
      ctx.fillRect(50, quoteInfoCardStart, quoteInfoCardWidth, quoteInfoCardHeight)

      // 卡片边框（使用fillRect绘制）
      ctx.fillStyle = cardBorderColor
      ctx.fillRect(50, quoteInfoCardStart, quoteInfoCardWidth, borderWidth)
      ctx.fillRect(50, quoteInfoCardStart + quoteInfoCardHeight - borderWidth, quoteInfoCardWidth, borderWidth)
      ctx.fillRect(50, quoteInfoCardStart, borderWidth, quoteInfoCardHeight)
      ctx.fillRect(50 + quoteInfoCardWidth - borderWidth, quoteInfoCardStart, borderWidth, quoteInfoCardHeight)

      y += 30
      ctx.textAlign = 'left'
      ctx.fillStyle = textColor
      ctx.font = `bold 20px ${fontFamily}`
      ctx.fillText('报价方', 70, y)
      y += 30

      ctx.font = `16px ${fontFamily}`
      if (quote.company_name) {
        ctx.fillStyle = textColor
        ctx.fillText(`公司：${quote.company_name}`, 70, y)
        y += lineHeight
      }

      if (quote.contact_person) {
        ctx.fillStyle = textColor
        ctx.fillText(`联系人：${quote.contact_person}`, 70, y)
        y += lineHeight
      }

      if (quote.contact_phone) {
        ctx.fillStyle = textColor
        ctx.fillText(`电话：${quote.contact_phone}`, 70, y)
        y += lineHeight
      }

      if (quote.contact_address) {
        ctx.fillStyle = textColor
        ctx.fillText(`地址：${quote.contact_address}`, 70, y)
        y += lineHeight
      }

      if (quote.contact_email) {
        ctx.fillStyle = textColor
        ctx.fillText(`邮箱：${quote.contact_email}`, 70, y)
        y += lineHeight
      }

      y += 30
    }

    // ========== 客户信息卡片（灰色背景 + 加粗标题）==========
    const customerCardStart = y
    const customerCardWidth = 650
    const customerCardHeight = 180

    // 浅灰色背景卡片
    ctx.fillStyle = cardBackgroundColor
    ctx.fillRect(50, customerCardStart, customerCardWidth, customerCardHeight)

    // 卡片边框（使用fillRect绘制）
    ctx.fillStyle = cardBorderColor
    ctx.fillRect(50, customerCardStart, customerCardWidth, borderWidth)
    ctx.fillRect(50, customerCardStart + customerCardHeight - borderWidth, customerCardWidth, borderWidth)
    ctx.fillRect(50, customerCardStart, borderWidth, customerCardHeight)
    ctx.fillRect(50 + customerCardWidth - borderWidth, customerCardStart, borderWidth, customerCardHeight)

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
    const productCardWidth = 650
    const productCardHeight = 500  // 预估高度

    // 浅灰色背景卡片
    ctx.fillStyle = cardBackgroundColor
    ctx.fillRect(50, productCardStart, productCardWidth, productCardHeight)

    // 卡片边框（使用fillRect绘制）
    ctx.fillStyle = cardBorderColor
    ctx.fillRect(50, productCardStart, productCardWidth, borderWidth)
    ctx.fillRect(50, productCardStart + productCardHeight - borderWidth, productCardWidth, borderWidth)
    ctx.fillRect(50, productCardStart, borderWidth, productCardHeight)
    ctx.fillRect(50 + productCardWidth - borderWidth, productCardStart, borderWidth, productCardHeight)

    // 表格格子区域（在卡片内部）
    const tableStartX = 70
    const tableStartY = productCardStart + 70
    const tableWidth = 610
    const colWidth = [200, 100, 100, 100, 100]  // 品名、单位、数量、单价、金额的列宽

    y += 30
    ctx.fillStyle = textColor
    ctx.font = `bold 20px ${fontFamily}`
    ctx.fillText('商品明细', 70, y)
    y += 40

    // ========== 表头 ==========
    y = tableStartY - 10
    ctx.font = `bold 14px ${fontFamily}`
    ctx.fillStyle = textColor

    const headerX = tableStartX
    ctx.fillText('品名', headerX + 10, y)
    ctx.fillText('单位', headerX + colWidth[0] + 10, y)
    ctx.fillText('数量', headerX + colWidth[0] + colWidth[1] + 10, y)
    ctx.fillText('单价', headerX + colWidth[0] + colWidth[1] + colWidth[2] + 10, y)
    ctx.fillText('金额', headerX + colWidth[0] + colWidth[1] + colWidth[2] + colWidth[3] + 10, y)

    y += 40

    // 计算表格内容实际高度
    const actualRows = Math.min(quote.items?.length || 0, 10)
    const tableContentHeight = actualRows * (lineHeight + 30)  // 每行高度（包括分隔线和间距）

    // ========== 绘制完整的表格格子（从表头到最后一行）==========
    ctx.fillStyle = gridColor

    // 绘制表头底部分隔线
    ctx.fillRect(tableStartX, tableStartY - 10, tableWidth, borderWidth)

    // 绘制纵向分隔线（从表头一直延伸到最后一行）
    let x = tableStartX
    for (let i = 0; i < colWidth.length; i++) {
      x += colWidth[i]
      ctx.fillRect(x - 1, tableStartY - 40, borderWidth, tableContentHeight + 40)
    }

    // ========== 表格内容 ==========
    ctx.font = `14px ${fontFamily}`

    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item, index) => {
        if (index >= 10) return // 最多显示10条

        ctx.fillStyle = textColor
        ctx.fillText(item.product_name, headerX + 10, y)
        ctx.fillText(item.unit, headerX + colWidth[0] + 10, y)
        ctx.fillText(item.quantity, headerX + colWidth[0] + colWidth[1] + 10, y)
        ctx.fillText(`¥${Number(item.unit_price).toFixed(2)}`, headerX + colWidth[0] + colWidth[1] + colWidth[2] + 10, y)
        ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, headerX + colWidth[0] + colWidth[1] + colWidth[2] + colWidth[3] + 10, y)

        y += lineHeight

        // 每行分隔线（使用fillRect绘制）
        ctx.fillStyle = gridColor
        ctx.fillRect(tableStartX, y, tableWidth, borderWidth)
        y += 30
      })
    }

    y += 20

    // ========== 金额汇总卡片 ==========
    const amountCardStart = y
    const amountCardWidth = 650
    const amountCardHeight = 130

    // 浅灰色背景卡片
    ctx.fillStyle = cardBackgroundColor
    ctx.fillRect(50, amountCardStart, amountCardWidth, amountCardHeight)

    // 卡片边框（使用fillRect绘制）
    ctx.fillStyle = cardBorderColor
    ctx.fillRect(50, amountCardStart, amountCardWidth, borderWidth)
    ctx.fillRect(50, amountCardStart + amountCardHeight - borderWidth, amountCardWidth, borderWidth)
    ctx.fillRect(50, amountCardStart, borderWidth, amountCardHeight)
    ctx.fillRect(50 + amountCardWidth - borderWidth, amountCardStart, borderWidth, amountCardHeight)

    y += 30
    ctx.fillStyle = textColor
    ctx.font = `bold 18px ${fontFamily}`
    ctx.textAlign = 'right'

    ctx.fillText('商品金额：', 650, y)
    y += lineHeight

    if (Number(quote.discount) > 0) {
      ctx.fillText(`优惠金额：-¥${Number(quote.discount).toFixed(2)}`, 650, y)
      y += lineHeight
    }

    ctx.fillStyle = textColor
    ctx.font = `bold 22px ${fontFamily}`
    ctx.fillText(`合计金额：¥${Number(quote.total_amount).toFixed(2)}`, 650, y)

    y += 30

    // ========== 备注（如果有）==========
    if (quote.remark) {
      y += 20
      const remarkCardStart = y
      const remarkCardWidth = 650
      const remarkCardHeight = 100

      // 浅灰色背景卡片
      ctx.fillStyle = cardBackgroundColor
      ctx.fillRect(50, remarkCardStart, remarkCardWidth, remarkCardHeight)

      // 卡片边框（使用fillRect绘制）
      ctx.fillStyle = cardBorderColor
      ctx.fillRect(50, remarkCardStart, remarkCardWidth, borderWidth)
      ctx.fillRect(50, remarkCardStart + remarkCardHeight - borderWidth, remarkCardWidth, borderWidth)
      ctx.fillRect(50, remarkCardStart, borderWidth, remarkCardHeight)
      ctx.fillRect(50 + remarkCardWidth - borderWidth, remarkCardStart, borderWidth, remarkCardHeight)

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
