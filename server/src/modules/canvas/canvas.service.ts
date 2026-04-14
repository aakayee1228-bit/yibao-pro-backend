import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common'
import { createCanvas, registerFont } from '@napi-rs/canvas'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'
import * as fs from 'fs'

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
export class CanvasService implements OnModuleInit {
  private fontLoaded = false
  private readonly fontDir = path.join(process.cwd(), 'fonts')
  private readonly fontPath = path.join(this.fontDir, 'NotoSansSC-Regular.ttf')

  async onModuleInit() {
    await this.loadChineseFont()
  }

  /**
   * 下载并加载中文字体
   */
  private async loadChineseFont(): Promise<void> {
    try {
      // 创建字体目录
      if (!fs.existsSync(this.fontDir)) {
        fs.mkdirSync(this.fontDir, { recursive: true })
      }

      // 检查字体文件是否已存在
      if (fs.existsSync(this.fontPath)) {
        console.log('字体文件已存在，正在加载...')
        try {
          registerFont(this.fontPath, { family: 'NotoSansSC' })
          this.fontLoaded = true
          console.log('✅ 中文字体加载成功')
          return
        } catch (error) {
          console.error('⚠️ 字体加载失败，尝试重新下载:', error)
        }
      }

      // 下载字体文件
      console.log('正在下载中文字体...')

      try {
        await this.downloadFont(
          'https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf',
          this.fontPath
        )
      } catch (error) {
        console.error('从 GitHub 下载失败，尝试备用源...')
        await this.downloadFont(
          'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf',
          this.fontPath
        )
      }

      // 加载字体
      registerFont(this.fontPath, { family: 'NotoSansSC' })
      this.fontLoaded = true
      console.log('✅ 中文字体下载并加载成功')
    } catch (error) {
      console.error('❌ 中文字体加载失败:', error)
      console.log('将使用默认字体（可能不支持中文）')
    }
  }

  /**
   * 下载字体文件
   */
  private downloadFont(url: string, dest: string): Promise<void> {
    const protocol = url.startsWith('https') ? https : http

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest)

      const request = protocol.get(url, (response) => {
        // 检查响应状态码
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 处理重定向
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            console.log('重定向到:', redirectUrl)
            this.downloadFont(redirectUrl, dest)
              .then(resolve)
              .catch(reject)
            return
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`下载失败，状态码: ${response.statusCode}`))
          return
        }

        response.pipe(file)

        file.on('finish', () => {
          file.close()
          resolve()
        })

        file.on('error', (err) => {
          fs.unlink(dest, () => {})
          reject(err)
        })
      })

      request.on('error', (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })

      request.setTimeout(30000, () => {
        request.destroy()
        fs.unlink(dest, () => {})
        reject(new Error('下载超时'))
      })
    })
  }

  /**
   * 获取中文字体名称
   */
  private getChineseFont(): string {
    return this.fontLoaded ? 'NotoSansSC' : 'Arial'
  }

  /**
   * 生成报价单图片
   */
  async generateQuoteImage(quoteId: string, userId?: string): Promise<{ tempFilePath: string; size: number }> {
    const client = getSupabaseClient()

    // 获取报价单详情
    let query = client
      .from('quotes')
      .select(`
        *,
        customers (*),
        items (*)
      `)
      .eq('id', quoteId)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: quote, error } = await query.single()

    if (error || !quote) {
      console.error('获取报价单详情失败:', error)
      throw new BadRequestException('获取报价单详情失败')
    }

    // 图片尺寸
    const width = 1200
    const height = 1800

    // 创建 Canvas
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // 配色方案
    const overallBgColor = '#F5F5F5'
    const cardBgColor = '#FFFFFF'
    const blue800 = '#1E40AF'
    const blue500 = '#3B82F6'
    const lineColor = '#E5E7EB'
    const textColor = '#111827'
    const gray600 = '#4B5563'
    const white = '#FFFFFF'

    // 整体背景
    ctx.fillStyle = overallBgColor
    ctx.fillRect(0, 0, width, height)

    let y = 20
    const padding = 30
    const cardWidth = width - padding * 2

    // 标题栏（蓝色渐变）
    const gradient = ctx.createLinearGradient(padding, y, padding + cardWidth, y)
    gradient.addColorStop(0, blue800)
    gradient.addColorStop(1, blue500)
    ctx.fillStyle = gradient
    ctx.fillRect(padding, y, cardWidth, 80)

    // 标题文字
    y += 50
    ctx.fillStyle = white
    ctx.font = `bold 32px ${this.getChineseFont()}`
    ctx.textAlign = 'center'
    ctx.fillText('报价单', width / 2, y)

    y += 30

    // 白色卡片
    ctx.fillStyle = cardBgColor
    ctx.fillRect(padding, y, cardWidth, height - y - 20)

    // 报价方信息
    if (quote.company_name || quote.contact_person || quote.contact_phone) {
      const infoHeight = 150
      ctx.fillStyle = blue500
      ctx.fillRect(padding, y, cardWidth, 45)
      ctx.fillStyle = white
      ctx.font = `bold 24px ${this.getChineseFont()}`
      ctx.textAlign = 'left'
      ctx.fillText('报价方信息', padding + 20, y + 30)

      y += 45
      ctx.fillStyle = textColor
      ctx.font = `20px ${this.getChineseFont()}`
      let infoY = y + 20

      if (quote.company_name) {
        ctx.fillText(`公司名称：${quote.company_name}`, padding + 20, infoY)
        infoY += 35
      }
      if (quote.contact_person) {
        ctx.fillText(`联系人：${quote.contact_person}`, padding + 20, infoY)
        infoY += 35
      }
      if (quote.contact_phone) {
        ctx.fillText(`联系电话：${quote.contact_phone}`, padding + 20, infoY)
        infoY += 35
      }
      y += 110
    }

    // 客户信息
    if (quote.customers) {
      ctx.fillStyle = gray600
      ctx.fillRect(padding, y, cardWidth, 45)
      ctx.fillStyle = white
      ctx.font = `bold 24px ${this.getChineseFont()}`
      ctx.textAlign = 'left'
      ctx.fillText('客户信息', padding + 20, y + 30)

      y += 45
      ctx.fillStyle = textColor
      ctx.font = `20px ${this.getChineseFont()}`
      let infoY = y + 20

      if (quote.customers.name) {
        ctx.fillText(`客户姓名：${quote.customers.name}`, padding + 20, infoY)
        infoY += 35
      }
      if (quote.customers.phone) {
        ctx.fillText(`联系电话：${quote.customers.phone}`, padding + 20, infoY)
        infoY += 35
      }
      if (quote.customers.address) {
        ctx.fillText(`地址：${quote.customers.address}`, padding + 20, infoY)
        infoY += 35
      }
      y += 110
    }

    // 商品表格
    ctx.fillStyle = blue500
    ctx.fillRect(padding, y, cardWidth, 60)
    ctx.fillStyle = white
    ctx.font = `bold 22px ${this.getChineseFont()}`
    ctx.textAlign = 'center'
    ctx.fillText('商品名称', padding + 150, y + 38)
    ctx.fillText('数量', padding + 420, y + 38)
    ctx.fillText('单价', padding + 540, y + 38)
    ctx.fillText('小计', padding + 660, y + 38)

    y += 60
    ctx.fillStyle = textColor
    ctx.font = `20px ${this.getChineseFont()}`

    quote.items.forEach((item: QuoteItem) => {
      // 行背景（交替色）
      const index = quote.items.indexOf(item)
      if (index % 2 === 1) {
        ctx.fillStyle = '#F9FAFB'
        ctx.fillRect(padding, y, cardWidth, 60)
      }

      ctx.fillStyle = textColor
      ctx.fillText(item.product_name.substring(0, 20), padding + 150, y + 38)
      ctx.fillText(item.quantity, padding + 420, y + 38)
      ctx.fillText(item.unit_price, padding + 540, y + 38)
      ctx.fillText(item.amount, padding + 660, y + 38)

      y += 60
    })

    // 合计信息
    y += 30
    ctx.fillStyle = gray600
    ctx.font = `20px ${this.getChineseFont()}`
    ctx.textAlign = 'right'
    ctx.fillText(`小计：¥${quote.subtotal}`, width - padding, y)
    y += 35
    if (parseFloat(quote.discount) > 0) {
      ctx.fillText(`折扣：-¥${quote.discount}`, width - padding, y)
      y += 35
    }
    ctx.fillStyle = blue800
    ctx.font = `bold 32px ${this.getChineseFont()}`
    ctx.fillText(`总计：¥${quote.total_amount}`, width - padding, y)

    // 底部信息
    y += 80
    ctx.fillStyle = gray600
    ctx.font = `18px ${this.getChineseFont()}`
    ctx.textAlign = 'center'
    ctx.fillText(`报价单号：${quote.quote_no}`, width / 2, y)
    y += 30
    ctx.fillText(`有效期：${quote.valid_days}天`, width / 2, y)
    y += 30
    const createdDate = new Date(quote.created_at).toLocaleDateString('zh-CN')
    ctx.fillText(`创建日期：${createdDate}`, width / 2, y)

    // 生成图片
    const buffer = canvas.toBuffer('image/png')
    const size = buffer.length

    console.log('图片生成成功，大小:', size, 'bytes')

    // 保存临时文件
    const tempDir = process.env.TEMP || '/tmp'
    const tempFilePath = path.join(tempDir, `quote_${Date.now()}.png`)

    fs.writeFileSync(tempFilePath, buffer)

    return {
      tempFilePath,
      size,
    }
  }
}
