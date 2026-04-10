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
   * 获取系统中可用的中文字体
   */
  private getChineseFont(): string {
    const { execSync } = require('child_process')
    let availableFonts = ''

    try {
      // 检测系统中可用的中文字体
      const fontList = execSync('fc-list :lang=zh-cn 2>/dev/null || echo ""').toString()

      if (fontList.includes('WenQuanYi Micro Hei')) {
        availableFonts = 'WenQuanYi Micro Hei'
      } else if (fontList.includes('WenQuanYi Zen Hei')) {
        availableFonts = 'WenQuanYi Zen Hei'
      } else if (fontList.includes('Noto Sans CJK')) {
        availableFonts = 'Noto Sans CJK SC'
      }

      // 如果检测到中文字体，构建字体配置
      if (availableFonts) {
        return `${availableFonts}, sans-serif`
      }
    } catch (error) {
      console.error('字体检测失败，使用默认配置:', error)
    }

    // 默认字体配置（包含常见的中文字体）
    return 'WenQuanYi Micro Hei, WenQuanYi Zen Hei, Noto Sans CJK SC, sans-serif'
  }

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
    const canvas = createCanvas(750, 1800)
    const ctx = canvas.getContext('2d')

    // 字体配置（使用系统中可用的中文字体）
    const fontFamily = this.getChineseFont()

    // 配色方案（完全按照详情表样式）
    const overallBgColor = '#F5F5F5'  // 整体浅灰色背景
    const cardBgColor = '#FFFFFF'     // 卡片白色背景
    const blue800 = '#1E40AF'         // 深蓝色（blue-800）
    const blue500 = '#3B82F6'         // 中蓝色（blue-500）
    const blue700 = '#1D4ED8'         // 蓝色文字
    const lineColor = '#E5E7EB'       // 浅灰色边框
    const textColor = '#111827'       // 深色文字
    const gray600 = '#4B5563'         // 灰色文字
    const red500 = '#EF4444'          // 红色文字
    const white = '#FFFFFF'           // 白色
    const cardPadding = 16            // 卡片内边距
    const tableRowHeight = 44         // 表格行高
    const infoRowHeight = 28          // 信息区行高

    // 整体浅灰色背景
    ctx.fillStyle = overallBgColor
    ctx.fillRect(0, 0, 750, 1800)

    let y = 20

    // ========== 标题栏（蓝色渐变背景，白色文字）==========
    // 创建蓝色渐变
    const gradient = ctx.createLinearGradient(20, y, 730, y)
    gradient.addColorStop(0, blue800)
    gradient.addColorStop(1, blue500)
    ctx.fillStyle = gradient
    ctx.fillRect(20, y, 710, 64)

    // 标题文字（居中，白色，加粗）
    y += 42
    ctx.fillStyle = white
    ctx.font = `bold 20px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillText('报价单', 375, y)

    y += 20

    // ========== 白色卡片内容区 ==========
    // 白色卡片背景
    ctx.fillStyle = cardBgColor
    const cardHeight = tableRowHeight * 12 + 200 // 预留高度
    ctx.fillRect(20, y, 710, cardHeight)

    // ========== 报价方信息区（带表格格子）==========
    if (quote.company_name || quote.contact_person || quote.contact_phone || quote.contact_address) {
      const infoBlockHeight = 130
      const startY = y

      // 绘制表格边框和格子
      ctx.fillStyle = cardBgColor
      ctx.fillRect(20, y, 710, infoBlockHeight)

      // 边框
      ctx.fillStyle = lineColor
      ctx.fillRect(20, y, 710, 1) // 上边框
      ctx.fillRect(20, y + infoBlockHeight, 710, 1) // 下边框
      ctx.fillRect(20, y, 1, infoBlockHeight) // 左边框
      ctx.fillRect(20 + 710, y, 1, infoBlockHeight) // 右边框

      // 纵向分隔线（分成两列）
      ctx.fillRect(380, y, 1, infoBlockHeight)

      // 横向分隔线
      ctx.fillRect(20, y + 35, 710, 1) // 标题分隔线

      // 左列标题
      ctx.fillStyle = textColor
      ctx.font = `bold 16px ${fontFamily}`
      ctx.textAlign = 'left'
      ctx.fillText('报价方信息', 40, y + 22)

      // 左列内容（靠左，垂直居中）
      ctx.fillStyle = gray600
      ctx.font = `14px ${fontFamily}`
      ctx.textAlign = 'left'

      let currentY = startY + 53 // 35 + (22 - 14) / 2 + 14
      if (quote.company_name) {
        ctx.fillText('公司名称', 40, currentY)
        ctx.fillStyle = textColor
        ctx.fillText(quote.company_name, 120, currentY)
        currentY += 22
        ctx.fillStyle = gray600
      }

      if (quote.contact_person) {
        ctx.fillText('联系人', 40, currentY)
        ctx.fillStyle = textColor
        ctx.fillText(quote.contact_person, 120, currentY)
        currentY += 22
        ctx.fillStyle = gray600
      }

      if (quote.contact_phone) {
        ctx.fillText('联系电话', 40, currentY)
        ctx.fillStyle = textColor
        ctx.fillText(quote.contact_phone, 120, currentY)
        currentY += 22
        ctx.fillStyle = gray600
      }

      if (quote.contact_address) {
        ctx.fillText('联系地址', 40, currentY)
        ctx.fillStyle = textColor
        ctx.fillText(quote.contact_address, 120, currentY)
      }

      // 右列内容（靠右，垂直居中，无标题）
      ctx.fillStyle = gray600
      ctx.font = `14px ${fontFamily}`
      ctx.textAlign = 'right'

      currentY = startY + 53 // 35 + (22 - 14) / 2 + 14

      // 单号
      ctx.fillText('单号', 710, currentY)
      ctx.fillStyle = textColor
      ctx.fillText(quote.quote_no, 690, currentY)
      currentY += 22
      ctx.fillStyle = gray600

      // 日期
      const dateStr = quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : '-'
      ctx.fillText('日期', 710, currentY)
      ctx.fillStyle = textColor
      ctx.fillText(dateStr, 690, currentY)
      currentY += 22
      ctx.fillStyle = gray600

      // 有效期
      ctx.fillText('有效期', 710, currentY)
      ctx.fillStyle = textColor
      ctx.fillText(`${quote.valid_days} 天`, 690, currentY)

      y = startY + infoBlockHeight + 20
    }

    // ========== 客户方信息区（带表格格子）==========
    const customerInfoHeight = 85
    const startY = y

    // 绘制表格边框和格子
    ctx.fillStyle = cardBgColor
    ctx.fillRect(20, y, 710, customerInfoHeight)

    // 边框
    ctx.fillStyle = lineColor
    ctx.fillRect(20, y, 710, 1) // 上边框
    ctx.fillRect(20, y + customerInfoHeight, 710, 1) // 下边框
    ctx.fillRect(20, y, 1, customerInfoHeight) // 左边框
    ctx.fillRect(20 + 710, y, 1, customerInfoHeight) // 右边框

    // 横向分隔线
    ctx.fillRect(20, y + 35, 710, 1) // 标题分隔线

    // 左列标题
    ctx.fillStyle = textColor
    ctx.font = `bold 16px ${fontFamily}`
    ctx.textAlign = 'left'
    ctx.fillText('客户方信息', 40, y + 22)

    // 左列详细信息（靠左，垂直居中）
    ctx.fillStyle = gray600
    ctx.font = `14px ${fontFamily}`
    ctx.textAlign = 'left'

    let currentY = startY + 50 // 35 + (16 - 14) / 2 + 14
    if (quote.customers?.name) {
      ctx.fillText('客户名称', 40, currentY)
      ctx.fillStyle = textColor
      ctx.fillText(quote.customers.name, 120, currentY)
      currentY += 16
      ctx.fillStyle = gray600
    }

    if (quote.customers?.company) {
      ctx.fillText('公司名称', 40, currentY)
      ctx.fillStyle = textColor
      ctx.fillText(quote.customers.company, 120, currentY)
      currentY += 16
      ctx.fillStyle = gray600
    }

    if (quote.customers?.phone) {
      ctx.fillText('联系电话', 40, currentY)
      ctx.fillStyle = blue700
      ctx.fillText(quote.customers.phone, 120, currentY)
    }

    y = startY + customerInfoHeight + 20

    // ========== 蓝色水平分隔线 ==========
    ctx.fillStyle = blue800
    ctx.fillRect(20, y, 710, 4)

    y += 12

    // ========== "商品明细"标题 ==========
    ctx.fillStyle = textColor
    ctx.font = `bold 16px ${fontFamily}`
    ctx.textAlign = 'left'
    ctx.fillText('商品明细', 40, y)

    y += 8

    // ========== 商品明细表格 ==========
    const tableWidth = 710
    const colWidths = [60, 220, 80, 80, 130, 140] // 序号、品名、单位、数量、单价、合计
    const maxRows = 10
    const actualRows = Math.min(quote.items?.length || 0, maxRows)

    // 蓝色表头行（圆角）
    ctx.fillStyle = blue800
    ctx.fillRect(20, y, tableWidth, tableRowHeight)

    // 表头文字（白色，加粗，居中）
    const headerY = y + 28
    ctx.fillStyle = white
    ctx.font = `bold 12px ${fontFamily}`
    ctx.textAlign = 'center'

    let colX = 20
    ctx.fillText('序号', colX + colWidths[0] / 2, headerY)
    colX += colWidths[0]
    ctx.fillText('品名', colX + colWidths[1] / 2, headerY)
    colX += colWidths[1]
    ctx.fillText('单位', colX + colWidths[2] / 2, headerY)
    colX += colWidths[2]
    ctx.fillText('数量', colX + colWidths[3] / 2, headerY)
    colX += colWidths[3]
    ctx.fillText('单价', colX + colWidths[4] / 2, headerY)
    colX += colWidths[4]
    ctx.fillText('合计', colX + colWidths[5] / 2, headerY)

    y += tableRowHeight

    // 表格内容（隔行变色）
    quote.items.slice(0, maxRows).forEach((item, index) => {
      const rowY = y + index * tableRowHeight

      // 隔行变色背景
      if (index % 2 === 0) {
        ctx.fillStyle = '#F9FAFB'
        ctx.fillRect(20, rowY, tableWidth, tableRowHeight)
      } else {
        ctx.fillStyle = white
        ctx.fillRect(20, rowY, tableWidth, tableRowHeight)
      }

      // 格子线（底部）
      ctx.fillStyle = lineColor
      ctx.fillRect(20, rowY + tableRowHeight - 1, tableWidth, 1)

      // 垂直格子线
      let vColX = 20
      for (let i = 0; i < colWidths.length - 1; i++) {
        vColX += colWidths[i]
        ctx.fillRect(vColX - 1, rowY, 1, tableRowHeight)
      }

      // 文字内容
      const textY = rowY + 28
      ctx.font = `14px ${fontFamily}`

      // 序号
      ctx.fillStyle = '#374151'
      ctx.textAlign = 'center'
      ctx.fillText(`${index + 1}`, 20 + colWidths[0] / 2, textY)

      // 品名
      ctx.fillStyle = '#374151'
      ctx.textAlign = 'left'
      ctx.fillText(item.product_name, 20 + colWidths[0] + 8, textY)

      // 单位
      ctx.fillStyle = '#374151'
      ctx.textAlign = 'center'
      ctx.fillText(item.unit, 20 + colWidths[0] + colWidths[1] + colWidths[2] / 2, textY)

      // 数量
      ctx.fillText(item.quantity, 20 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, textY)

      // 单价
      ctx.fillText(`¥${Number(item.unit_price).toFixed(2)}`, 20 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] / 2, textY)

      // 合计（蓝色）
      ctx.fillStyle = blue700
      ctx.font = `bold 14px ${fontFamily}`
      ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, 20 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] / 2, textY)
    })

    y += actualRows * tableRowHeight

    // ========== 金额汇总区（有边框）==========
    y += 16
    const totalHeight = 120
    ctx.fillStyle = cardBgColor

    // 绘制边框
    ctx.fillStyle = lineColor
    ctx.fillRect(20, y, tableWidth, 1) // 上边框
    ctx.fillRect(20, y + totalHeight, tableWidth, 1) // 下边框
    ctx.fillRect(20, y, 1, totalHeight) // 左边框
    ctx.fillRect(20 + tableWidth, y, 1, totalHeight) // 右边框

    // 商品金额
    y += 28
    ctx.fillStyle = gray600
    ctx.font = `14px ${fontFamily}`
    ctx.textAlign = 'left'
    ctx.fillText('商品金额', 40, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = textColor
    ctx.fillText(`¥${Number(quote.subtotal).toFixed(2)}`, 710, y)

    // 优惠金额（红色）
    if (Number(quote.discount) > 0) {
      y += 28
      ctx.fillStyle = gray600
      ctx.textAlign = 'left'
      ctx.fillText('优惠金额', 40, y)
      ctx.textAlign = 'right'
      ctx.fillStyle = red500
      ctx.fillText(`-¥${Number(quote.discount).toFixed(2)}`, 710, y)

      y += 28
    }

    // 分隔线
    ctx.fillStyle = lineColor
    ctx.fillRect(40, y, 660, 1)

    // 合计金额（蓝色，加粗）
    y += 36
    ctx.textAlign = 'left'
    ctx.fillStyle = textColor
    ctx.font = `bold 16px ${fontFamily}`
    ctx.fillText('合计金额', 40, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = blue700
    ctx.font = `bold 20px ${fontFamily}`
    ctx.fillText(`¥${Number(quote.total_amount).toFixed(2)}`, 710, y)

    y += 36

    // ========== 备注区 ==========
    if (quote.remark) {
      y += 16
      ctx.fillStyle = gray600
      ctx.font = `14px ${fontFamily}`
      ctx.textAlign = 'left'
      ctx.fillText(`备注：${quote.remark}`, 40, y)

      y += 24
    }

    // ========== 底部说明 ==========
    y += 20
    ctx.fillStyle = '#9CA3AF'
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
