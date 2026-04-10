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

    // 创建 Canvas（3:4 比例）
    const canvas = createCanvas(750, 1000)
    const ctx = canvas.getContext('2d')

    // 定义配色方案（浅蓝色主题）
    const colors = {
      background: '#DEEBFB',      // 主背景 - 浅蓝色
      cardBackground: '#FFFFFF',  // 卡片背景 - 白色
      primary: '#2563EB',         // 主色 - 蓝色
      primaryLight: '#3B82F6',    // 主色浅 - 蓝色
      secondary: '#64748B',       // 次要色 - 灰色
      text: '#1E293B',            // 文字色 - 深色
      textLight: '#94A3B8',       // 文字浅色 - 浅灰色
      border: '#E2E8F0',          // 边框色
      success: '#10B981',         // 成功色 - 绿色
      danger: '#EF4444',          // 危险色 - 红色
    }

    // 绘制主背景
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, 750, 1000)

    // ========== 顶部标题区域 ==========
    ctx.fillStyle = colors.cardBackground
    ctx.fillRect(30, 30, 690, 120)

    // 标题背景装饰条
    ctx.fillStyle = colors.primary
    ctx.fillRect(30, 30, 8, 120)

    // 标题文字
    ctx.fillStyle = colors.text
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('产品报价单', 70, 90)

    // 右侧图标装饰（圆形）
    ctx.fillStyle = colors.primaryLight
    ctx.beginPath()
    ctx.arc(660, 90, 30, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('¥', 660, 98)

    // ========== 客户信息卡片 ==========
    const cardY = 180
    ctx.fillStyle = colors.cardBackground
    this.roundRect(ctx, 30, cardY, 690, 100, 12)
    ctx.fill()

    // 客户信息标题
    ctx.fillStyle = colors.secondary
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('客户信息', 60, cardY + 35)

    // 客户名称
    const customerName = quote.customers?.name || '未命名'
    ctx.fillStyle = colors.text
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText(customerName, 60, cardY + 70)

    // 公司名称
    if (quote.customers?.company) {
      ctx.fillStyle = colors.textLight
      ctx.font = '16px sans-serif'
      ctx.fillText(quote.customers.company, 60, cardY + 90)
    }

    // 联系方式
    if (quote.customers?.phone) {
      ctx.fillStyle = colors.textLight
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(quote.customers.phone, 690, cardY + 70)
    }

    // ========== 报价单信息 ==========
    const infoY = 300
    ctx.fillStyle = colors.cardBackground
    this.roundRect(ctx, 30, infoY, 690, 80, 12)
    ctx.fill()

    ctx.fillStyle = colors.secondary
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`报价单号：${quote.quote_no}`, 60, infoY + 35)

    ctx.fillStyle = colors.textLight
    ctx.font = '14px sans-serif'
    const dateStr = quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : ''
    ctx.fillText(`创建日期：${dateStr}`, 60, infoY + 60)

    ctx.fillStyle = colors.primary
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`有效期 ${quote.valid_days} 天`, 690, infoY + 50)

    // ========== 商品明细表格 ==========
    const tableY = 400
    const tableHeight = 400

    // 表格背景
    ctx.fillStyle = colors.cardBackground
    this.roundRect(ctx, 30, tableY, 690, tableHeight, 12)
    ctx.fill()

    // 表头
    const headerHeight = 50
    ctx.fillStyle = colors.primary
    this.roundRectTop(ctx, 30, tableY, 690, headerHeight, 12)
    ctx.fill()

    // 表头文字
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('品名', 80, tableY + 32)
    ctx.fillText('单位', 260, tableY + 32)
    ctx.fillText('数量', 340, tableY + 32)
    ctx.fillText('单价', 420, tableY + 32)
    ctx.fillText('金额', 620, tableY + 32)

    // 表格内容
    const rowHeight = 45
    const startY = tableY + headerHeight
    const maxRows = Math.floor((tableHeight - headerHeight) / rowHeight)

    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item, index) => {
        if (index >= maxRows) return

        const rowY = startY + index * rowHeight

        // 行背景（交替颜色）
        if (index % 2 === 0) {
          ctx.fillStyle = '#F8FAFC'
          ctx.fillRect(40, rowY + 5, 670, rowHeight - 10)
        }

        // 绘制数据
        ctx.fillStyle = colors.text
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'left'

        // 品名（截断过长文本）
        const maxNameWidth = 160
        const displayName = this.truncateText(ctx, item.product_name, maxNameWidth)
        ctx.fillText(displayName, 80, rowY + 28)

        // 单位
        ctx.textAlign = 'center'
        ctx.fillText(item.unit, 260, rowY + 28)

        // 数量
        ctx.fillText(item.quantity, 340, rowY + 28)

        // 单价
        ctx.fillText(`¥${Number(item.unit_price).toFixed(2)}`, 420, rowY + 28)

        // 金额
        ctx.fillStyle = colors.primary
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText(`¥${Number(item.amount).toFixed(2)}`, 620, rowY + 28)
      })
    }

    // ========== 金额汇总 ==========
    const summaryY = 830
    ctx.fillStyle = colors.cardBackground
    this.roundRect(ctx, 30, summaryY, 690, 140, 12)
    ctx.fill()

    // 金额项
    ctx.fillStyle = colors.secondary
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'left'

    ctx.fillText('商品金额', 60, summaryY + 40)
    ctx.fillStyle = colors.text
    ctx.fillText(`¥${Number(quote.subtotal).toFixed(2)}`, 690, summaryY + 40)

    // 优惠
    if (Number(quote.discount) > 0) {
      ctx.fillStyle = colors.secondary
      ctx.fillText('优惠金额', 60, summaryY + 70)
      ctx.fillStyle = colors.danger
      ctx.fillText(`-¥${Number(quote.discount).toFixed(2)}`, 690, summaryY + 70)
    }

    // 分隔线
    ctx.strokeStyle = colors.border
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, summaryY + 85)
    ctx.lineTo(690, summaryY + 85)
    ctx.stroke()

    // 合计
    const offsetY = Number(quote.discount) > 0 ? 110 : 80
    ctx.fillStyle = colors.text
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('合计金额', 60, summaryY + offsetY)

    ctx.fillStyle = colors.primary
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`¥${Number(quote.total_amount).toFixed(2)}`, 690, summaryY + offsetY)

    // ========== 备注 ==========
    if (quote.remark) {
      ctx.fillStyle = colors.textLight
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'left'
      const remarkText = `备注：${this.truncateText(ctx, quote.remark, 600)}`
      ctx.fillText(remarkText, 60, 985)
    }

    // 转换为 Buffer
    return canvas.toBuffer('image/png')
  }

  /**
   * 绘制圆角矩形
   */
  private roundRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  /**
   * 绘制圆角矩形（仅顶部）
   */
  private roundRectTop(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height)
    ctx.lineTo(x, y + height)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  /**
   * 截断文本以适应宽度
   */
  private truncateText(ctx: any, text: string, maxWidth: number): string {
    const width = ctx.measureText(text).width
    if (width <= maxWidth) {
      return text
    }

    // 二分查找截断点
    let left = 0
    let right = text.length
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const truncated = text.substring(0, mid) + '...'
      const truncatedWidth = ctx.measureText(truncated).width
      if (truncatedWidth <= maxWidth) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    return text.substring(0, left - 1) + '...'
  }
}
