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
   * 生成报价单图片（严格按照参考样式）
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

    // 字体配置
    const fontFamily = '"WenQuanYi Micro Hei", "文泉驿微米黑", sans-serif'

    // 配色方案（严格按照参考样式）
    const backgroundColor = '#FFFFFF'  // 白色背景
    const headerBgColor = '#ECECEC'    // 表格标题行浅灰色背景
    const lineColor = '#000000'        // 黑色表格线
    const textColor = '#000000'        // 黑色文字
    const lineWidth = 1                // 表格线宽度1像素
    const lineHeight = 35              // 行高
    const cardPadding = 15             // 卡片内边距

    // 纯白色背景
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, 750, 1600)

    let y = 60

    // ========== 标题区（白色背景）==========
    ctx.fillStyle = textColor
    ctx.font = `bold 32px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillText('报价单', 375, y)

    y += 50

    // ========== 报价时间和报价单号（白色背景）==========
    ctx.textAlign = 'left'
    ctx.font = `14px ${fontFamily}`
    ctx.fillStyle = textColor

    const dateStr = quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : ''
    ctx.fillText(`报价时间：${dateStr}`, 50, y)
    y += lineHeight

    ctx.fillText(`报价单号：${quote.quote_no}`, 50, y)
    y += lineHeight

    ctx.fillText(`有效期：${quote.valid_days} 天`, 50, y)

    y += 40

    // ========== 报价方信息（表格形式，标题行浅灰色背景）==========
    // 标题行（浅灰色背景 + 加粗）
    ctx.fillStyle = headerBgColor
    ctx.fillRect(50, y, 650, 35)
    ctx.fillStyle = lineColor
    ctx.fillRect(50, y, 650, lineWidth)      // 上边框
    ctx.fillRect(50, y + 34, 650, lineWidth) // 下边框
    ctx.fillRect(50, y, lineWidth, 35)      // 左边框
    ctx.fillRect(700, y, lineWidth, 35)     // 右边框

    y += 22
    ctx.fillStyle = textColor
    ctx.font = `bold 14px ${fontFamily}`
    ctx.textAlign = 'left'
    ctx.fillText('报价方信息', 60, y)

    y += 25

    // 报价方信息内容行（白色背景）
    ctx.fillStyle = backgroundColor
    ctx.fillRect(50, y, 650, lineHeight * 5)
    ctx.fillStyle = lineColor
    ctx.fillRect(50, y + lineHeight * 5, 650, lineWidth) // 下边框
    ctx.fillRect(50, y, lineWidth, lineHeight * 5)      // 左边框
    ctx.fillRect(700, y, lineWidth, lineHeight * 5)     // 右边框

    ctx.font = `14px ${fontFamily}`
    if (quote.company_name) {
      ctx.fillStyle = textColor
      ctx.fillText(`单位：${quote.company_name}`, 60, y)
      y += lineHeight
    }

    if (quote.contact_person) {
      ctx.fillStyle = textColor
      ctx.fillText(`联系人：${quote.contact_person}`, 60, y)
      y += lineHeight
    }

    if (quote.contact_phone) {
      ctx.fillStyle = textColor
      ctx.fillText(`电话：${quote.contact_phone}`, 60, y)
      y += lineHeight
    }

    if (quote.contact_email) {
      ctx.fillStyle = textColor
      ctx.fillText(`邮箱：${quote.contact_email}`, 60, y)
      y += lineHeight
    }

    if (quote.contact_address) {
      ctx.fillStyle = textColor
      ctx.fillText(`地址：${quote.contact_address}`, 60, y)
      y += lineHeight
    }

    y += 15

    // ========== 客户方信息（表格形式，标题行浅灰色背景）==========
    // 标题行（浅灰色背景 + 加粗）
    ctx.fillStyle = headerBgColor
    ctx.fillRect(50, y, 650, 35)
    ctx.fillStyle = lineColor
    ctx.fillRect(50, y, 650, lineWidth)
    ctx.fillRect(50, y + 34, 650, lineWidth)
    ctx.fillRect(50, y, lineWidth, 35)
    ctx.fillRect(700, y, lineWidth, 35)

    y += 22
    ctx.fillStyle = textColor
    ctx.font = `bold 14px ${fontFamily}`
    ctx.fillText('客户方信息', 60, y)

    y += 25

    // 客户信息内容行（白色背景）
    ctx.fillStyle = backgroundColor
    ctx.fillRect(50, y, 650, lineHeight * 5)
    ctx.fillStyle = lineColor
    ctx.fillRect(50, y + lineHeight * 5, 650, lineWidth)
    ctx.fillRect(50, y, lineWidth, lineHeight * 5)
    ctx.fillRect(700, y, lineWidth, lineHeight * 5)

    ctx.font = `14px ${fontFamily}`
    if (quote.customers?.name) {
      ctx.fillStyle = textColor
      ctx.fillText(`客户名称：${quote.customers.name}`, 60, y)
      y += lineHeight
    }

    if (quote.customers?.company) {
      ctx.fillStyle = textColor
      ctx.fillText(`单位：${quote.customers.company}`, 60, y)
      y += lineHeight
    }

    if (quote.customers?.phone) {
      ctx.fillStyle = textColor
      ctx.fillText(`电话：${quote.customers.phone}`, 60, y)
      y += lineHeight
    }

    if (quote.customers?.address) {
      ctx.fillStyle = textColor
      ctx.fillText(`地址：${quote.customers.address}`, 60, y)
      y += lineHeight
    }

    y += lineHeight  // 空一行

    y += 15

    // ========== 商品明细（表格形式，表头行浅灰色背景）==========
    const tableStartY = y

    // 表头行（浅灰色背景 + 加粗）
    ctx.fillStyle = headerBgColor
    ctx.fillRect(50, y, 650, 35)
    ctx.fillStyle = lineColor
    ctx.fillRect(50, y, 650, lineWidth)
    ctx.fillRect(50, y + 34, 650, lineWidth)
    ctx.fillRect(50, y, lineWidth, 35)
    ctx.fillRect(700, y, lineWidth, 35)

    y += 22
    ctx.fillStyle = textColor
    ctx.font = `bold 14px ${fontFamily}`
    ctx.fillText('序号', 60, y)
    ctx.fillText('商品名称', 120, y)
    ctx.fillText('单位', 320, y)
    ctx.fillText('数量', 380, y)
    ctx.fillText('单价', 440, y)
    ctx.fillText('金额', 510, y)
    ctx.fillText('备注', 590, y)

    y += 25

    // 商品明细内容行（白色背景）
    const maxRows = 10
    const actualRows = Math.min(quote.items?.length || 0, maxRows)

    ctx.fillStyle = backgroundColor
    ctx.fillRect(50, y, 650, lineHeight * actualRows)
    ctx.fillStyle = lineColor

    // 绘制纵向分隔线
    const colPositions = [50, 110, 310, 370, 430, 500, 580, 700]
    colPositions.forEach(x => {
      ctx.fillRect(x, tableStartY, lineWidth, lineHeight * actualRows + 35)
    })

    // 绘制横向分隔线
    for (let i = 0; i <= actualRows; i++) {
      ctx.fillRect(50, y + i * lineHeight, 650, lineWidth)
    }

    // 填充商品数据
    ctx.font = `14px ${fontFamily}`
    quote.items.slice(0, maxRows).forEach((item, index) => {
      const rowY = y + lineHeight * index + 22
      ctx.fillStyle = textColor
      ctx.fillText(`${index + 1}`, 65, rowY)
      ctx.fillText(item.product_name, 120, rowY)
      ctx.fillText(item.unit, 320, rowY)
      ctx.fillText(item.quantity, 380, rowY)
      ctx.fillText(`¥${Number(item.unit_price).toFixed(2)}`, 440, rowY)
      ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, 510, rowY)
      if (item.remark) {
        ctx.fillText(item.remark, 590, rowY)
      }
    })

    y += lineHeight * actualRows + 15

    // ========== 合计区（白色背景）==========
    ctx.fillStyle = backgroundColor
    ctx.fillRect(50, y, 650, lineHeight * 2)
    ctx.fillStyle = lineColor
    ctx.fillRect(50, y, 650, lineWidth)
    ctx.fillRect(50, y + lineHeight * 2, 650, lineWidth)
    ctx.fillRect(50, y, lineWidth, lineHeight * 2)
    ctx.fillRect(700, y, lineWidth, lineHeight * 2)

    y += 25
    ctx.font = `bold 14px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.textAlign = 'left'
    ctx.fillText('合计（大写）：', 60, y)
    ctx.fillText('合计（小写）：', 60, y + lineHeight)

    ctx.textAlign = 'right'
    const amountStr = Number(quote.total_amount).toFixed(2)
    ctx.fillText(this.numberToChinese(Number(quote.total_amount)), 700, y)
    ctx.fillText(`¥${amountStr}`, 700, y + lineHeight)

    y += lineHeight * 2 + 15

    // ========== 备注说明区（白色背景）==========
    if (quote.remark) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(50, y, 650, lineHeight * 2)
      ctx.fillStyle = lineColor
      ctx.fillRect(50, y, 650, lineWidth)
      ctx.fillRect(50, y + lineHeight * 2, 650, lineWidth)
      ctx.fillRect(50, y, lineWidth, lineHeight * 2)
      ctx.fillRect(700, y, lineWidth, lineHeight * 2)

      y += 25
      ctx.font = `bold 14px ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'left'
      ctx.fillText('备注说明：', 60, y)

      y += lineHeight
      ctx.font = `14px ${fontFamily}`
      ctx.fillText(quote.remark, 60, y)

      y += lineHeight + 15
    }

    // ========== 底部说明（白色背景）==========
    ctx.fillStyle = textColor
    ctx.font = `12px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillText('此报价单仅供参考，请以实际交易为准', 375, y)

    // 转换为 Buffer
    return canvas.toBuffer('image/png')
  }

  /**
   * 数字转中文大写
   */
  private numberToChinese(num: number): string {
    const units = ['元', '万', '亿']
    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
    const smallUnits = ['', '拾', '佰', '仟']

    if (num === 0) return '零元整'

    const intPart = Math.floor(num)
    const decPart = Math.round((num - intPart) * 100)

    let intStr = ''
    let temp = intPart

    for (let i = 0; i < units.length && temp > 0; i++) {
      const section = temp % 10000
      if (section > 0) {
        let sectionStr = ''
        let sectionTemp = section
        for (let j = 0; j < 4 && sectionTemp > 0; j++) {
          const digit = sectionTemp % 10
          if (digit > 0) {
            sectionStr = digits[digit] + smallUnits[j] + sectionStr
          } else if (sectionStr.length > 0 && sectionStr[0] !== '零') {
            sectionStr = '零' + sectionStr
          }
          sectionTemp = Math.floor(sectionTemp / 10)
        }
        intStr = sectionStr + units[i] + intStr
      }
      temp = Math.floor(temp / 10000)
    }

    if (intStr === '') intStr = '零元'
    else intStr = intStr + '整'

    if (decPart > 0) {
      intStr = intStr.replace('整', '')
      const jiao = Math.floor(decPart / 10)
      const fen = decPart % 10
      if (jiao > 0) intStr += digits[jiao] + '角'
      if (fen > 0) intStr += digits[fen] + '分'
      if (intStr === '') intStr = '零'
    }

    return intStr
  }
}
