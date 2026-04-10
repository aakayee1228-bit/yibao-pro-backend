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
   * 生成报价单图片（完全按照详情表样式）
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
    const fontFamily = '"Microsoft YaHei", "微软雅黑", sans-serif'

    // 配色方案（完全按照详情表样式）
    const overallBgColor = '#F5F5F5'  // 整体浅灰色背景
    const cardBgColor = '#FFFFFF'     // 卡片白色背景
    const headerBgColor = '#2E8BFF'   // 蓝色表头背景
    const lineColor = '#E0E0E0'       // 浅灰色格子线
    const textColor = '#000000'        // 黑色文字
    const blueColor = '#2E8BFF'        // 蓝色文字
    const redColor = '#FF0000'         // 红色文字
    const white = '#FFFFFF'            // 白色
    const lineWidth = 1                // 格子线宽度1像素
    const cardPadding = 15             // 卡片内边距
    const tableRowHeight = 40          // 表格行高
    const infoRowHeight = 30           // 信息区行高
    const titleHeight = 60             // 标题栏高度

    // 整体浅灰色背景
    ctx.fillStyle = overallBgColor
    ctx.fillRect(0, 0, 750, 1600)

    let y = 20

    // ========== 标题栏（蓝色背景，白色文字）==========
    ctx.fillStyle = headerBgColor
    ctx.fillRect(20, y, 710, titleHeight)

    y += 38
    ctx.fillStyle = white
    ctx.font = `bold 18px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillText('产品报价单', 375, y)

    y += 40

    // ========== 客户信息区（左侧客户信息，右侧单号信息）==========
    // 白色卡片背景
    ctx.fillStyle = cardBgColor
    ctx.fillRect(20, y, 710, infoRowHeight * 3 + 10)

    // 左侧：客户信息
    let customerInfoY = y + 20
    ctx.fillStyle = textColor
    ctx.font = `bold 16px ${fontFamily}`
    ctx.textAlign = 'left'
    ctx.fillText(`客户：${quote.customers?.name || '未命名'}`, 40, customerInfoY)

    customerInfoY += infoRowHeight
    ctx.font = `14px ${fontFamily}`
    if (quote.customers?.company) {
      ctx.fillStyle = textColor
      ctx.fillText(quote.customers.company, 40, customerInfoY)
    }

    customerInfoY += infoRowHeight
    if (quote.customers?.phone) {
      ctx.fillStyle = textColor
      ctx.fillText(quote.customers.phone, 40, customerInfoY)
    }

    // 右侧：单号/日期/有效期
    let quoteInfoY = y + 20
    ctx.textAlign = 'right'
    ctx.font = `14px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.fillText(`单号：${quote.quote_no}`, 710, quoteInfoY)

    quoteInfoY += infoRowHeight
    const dateStr = quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : ''
    ctx.fillText(`日期：${dateStr}`, 710, quoteInfoY)

    quoteInfoY += infoRowHeight
    ctx.fillText(`有效期：${quote.valid_days} 天`, 710, quoteInfoY)

    y += infoRowHeight * 3 + 20

    // ========== 商品明细表格（蓝色表头，白色内容）==========
    const tableWidth = 710
    const colWidths = [70, 210, 70, 70, 140, 150] // 序号、品名、单位、数量、单价、合计
    const maxRows = 10
    const actualRows = Math.min(quote.items?.length || 0, maxRows)

    // 白色卡片背景
    ctx.fillStyle = cardBgColor
    ctx.fillRect(20, y, tableWidth, tableRowHeight * (actualRows + 1) + 10)

    // 蓝色表头行
    ctx.fillStyle = headerBgColor
    ctx.fillRect(20, y, tableWidth, tableRowHeight)

    // 表头文字（白色，加粗）
    y += 25
    ctx.fillStyle = white
    ctx.font = `bold 14px ${fontFamily}`
    ctx.textAlign = 'left'

    let colX = 20
    ctx.fillText('序号', colX + 10, y)
    colX += colWidths[0]
    ctx.fillText('品名', colX + 10, y)
    colX += colWidths[1]
    ctx.fillText('单位', colX + 10, y)
    colX += colWidths[2]
    ctx.fillText('数量', colX + 10, y)
    colX += colWidths[3]
    ctx.fillText('单价', colX + 10, y)
    colX += colWidths[4]
    ctx.fillText('合计', colX + 10, y)

    // 表头下沿蓝色线
    y -= 15
    ctx.fillStyle = headerBgColor
    ctx.fillRect(20, y + tableRowHeight, tableWidth, lineWidth)

    // 绘制表格格子线（浅灰色）
    ctx.fillStyle = lineColor

    // 纵向线
    colX = 20
    for (let i = 0; i < colWidths.length; i++) {
      colX += colWidths[i]
      ctx.fillRect(colX - 1, y, lineWidth, tableRowHeight * (actualRows + 1))
    }

    // 横向线（每行之间）
    y += tableRowHeight
    for (let i = 0; i < actualRows; i++) {
      ctx.fillRect(20, y + i * tableRowHeight, tableWidth, lineWidth)
    }

    // 外边框
    ctx.fillRect(20, y - tableRowHeight, tableWidth, lineWidth) // 上边框
    ctx.fillRect(20, y + actualRows * tableRowHeight, tableWidth, lineWidth) // 下边框
    ctx.fillRect(20, y - tableRowHeight, lineWidth, tableRowHeight * (actualRows + 1)) // 左边框
    ctx.fillRect(20 + tableWidth, y - tableRowHeight, lineWidth, tableRowHeight * (actualRows + 1)) // 右边框

    // 填充商品数据
    y += 25
    ctx.font = `14px ${fontFamily}`
    quote.items.slice(0, maxRows).forEach((item, index) => {
      const rowY = y + index * tableRowHeight
      ctx.fillStyle = textColor
      ctx.textAlign = 'left'

      colX = 20
      ctx.fillText(`${index + 1}`, colX + 10, rowY)
      colX += colWidths[0]
      ctx.fillText(item.product_name, colX + 10, rowY)
      colX += colWidths[1]
      ctx.fillText(item.unit, colX + 10, rowY)
      colX += colWidths[2]
      ctx.fillText(item.quantity, colX + 10, rowY)
      colX += colWidths[3]
      ctx.fillText(`¥${Number(item.unit_price).toFixed(2)}`, colX + 10, rowY)
      colX += colWidths[4]
      ctx.fillStyle = blueColor
      ctx.textAlign = 'right'
      ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, 20 + tableWidth - 10, rowY)
    })

    y += actualRows * tableRowHeight + 25

    // ========== 合计区（白色卡片，外边框）==========
    const totalHeight = tableRowHeight * 3
    ctx.fillStyle = cardBgColor
    ctx.fillRect(20, y, tableWidth, totalHeight)

    // 外边框（浅灰色）
    ctx.fillStyle = lineColor
    ctx.fillRect(20, y, tableWidth, lineWidth) // 上边框
    ctx.fillRect(20, y + totalHeight, tableWidth, lineWidth) // 下边框
    ctx.fillRect(20, y, lineWidth, totalHeight) // 左边框
    ctx.fillRect(20 + tableWidth, y, lineWidth, totalHeight) // 右边框

    y += 25
    ctx.font = `14px ${fontFamily}`

    // 商品金额
    ctx.textAlign = 'left'
    ctx.fillStyle = textColor
    ctx.fillText('商品金额', 40, y)
    ctx.textAlign = 'right'
    ctx.fillText(`¥${Number(quote.subtotal).toFixed(2)}`, 710, y)

    y += tableRowHeight

    // 优惠金额（红色）
    if (Number(quote.discount) > 0) {
      ctx.textAlign = 'left'
      ctx.fillStyle = redColor
      ctx.fillText('优惠金额', 40, y)
      ctx.textAlign = 'right'
      ctx.fillText(`-¥${Number(quote.discount).toFixed(2)}`, 710, y)

      y += tableRowHeight
    }

    // 合计金额（蓝色，加粗）
    ctx.textAlign = 'left'
    ctx.fillStyle = blueColor
    ctx.font = `bold 16px ${fontFamily}`
    ctx.fillText('合计金额', 40, y)
    ctx.textAlign = 'right'
    const amountStr = Number(quote.total_amount).toFixed(2)
    ctx.fillText(`¥${amountStr}`, 710, y)

    y += totalHeight + 20

    // ========== 备注说明区（纯文字）==========
    if (quote.remark) {
      ctx.font = `14px ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'left'
      ctx.fillText(`备注：${quote.remark}`, 40, y)

      y += 30
    }

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
