import { Injectable, BadRequestException } from '@nestjs/common'
import { createCanvas, registerFont } from '@napi-rs/canvas'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import * as path from 'path'
import * as https from 'https'
import * as fs from 'fs'

// 接口定义保持不变
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
  private fontLoaded = false

  constructor() {
    this.loadChineseFont()
  }

  private async loadChineseFont() {
    const fontDir = path.join(process.cwd(), 'fonts')
    const fontPath = path.join(fontDir, 'NotoSansSC-Regular.ttf')

    try {
      if (!fs.existsSync(fontDir)) {
        fs.mkdirSync(fontDir, { recursive: true })
      }

      if (fs.existsSync(fontPath)) {
        registerFont(fontPath, { family: 'NotoSansSC' })
        this.fontLoaded = true
        console.log('已加载中文字体')
        return
      }

      console.log('字体不存在，跳过注册')
    } catch (error) {
      console.error('字体加载失败:', error)
    }
  }

  private getChineseFont(): string {
    return this.fontLoaded ? 'NotoSansSC' : 'sans-serif'
  }
}
