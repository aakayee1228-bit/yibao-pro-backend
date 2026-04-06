import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface QuoteItem {
  product_id?: string
  product_name: string
  unit: string
  quantity: number
  unit_price: number
  discount?: number
  amount: number
  remark?: string
}

interface CreateQuoteDto {
  customer_id: string
  items: QuoteItem[]
  discount?: number
  remark?: string
  valid_days?: number
}

@Injectable()
export class QuotesService {
  /**
   * 获取报价单列表
   */
  async getAll(userId?: string, filters?: { status?: string; customer_id?: string }) {
    const client = getSupabaseClient()
    
    let query = client
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }

    const { data: quotes, error } = await query

    if (error) {
      console.error('获取报价单列表失败:', error)
      throw new BadRequestException('获取报价单列表失败')
    }

    // 手动获取客户信息
    if (quotes && quotes.length > 0) {
      const customerIds = [...new Set(quotes.map(q => q.customer_id))]
      const { data: customers } = await client
        .from('customers')
        .select('id, name, phone')
        .in('id', customerIds)
      
      const customerMap = new Map((customers || []).map(c => [c.id, c]))
      
      return quotes.map(quote => ({
        ...quote,
        customers: customerMap.get(quote.customer_id) || null
      }))
    }

    return quotes || []
  }

  /**
   * 获取单个报价单详情
   */
  async getById(id: string) {
    const client = getSupabaseClient()

    const { data: quote, error: quoteError } = await client
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (quoteError) {
      throw new NotFoundException('报价单不存在')
    }

    // 手动获取客户信息
    let customerInfo: { id: string; name: string; phone: string; address: string; company: string } | null = null
    if (quote.customer_id) {
      const { data: customer } = await client
        .from('customers')
        .select('id, name, phone, address, company')
        .eq('id', quote.customer_id)
        .single()
      customerInfo = customer as typeof customerInfo
    }

    // 获取报价单明细
    const { data: items, error: itemsError } = await client
      .from('quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('id', { ascending: true })

    if (itemsError) {
      console.error('获取报价单明细失败:', itemsError)
    }

    return {
      ...quote,
      customers: customerInfo,
      items: items || [],
    }
  }

  /**
   * 创建报价单
   */
  async create(userId: string, dto: CreateQuoteDto) {
    const client = getSupabaseClient()

    // 验证客户是否存在
    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', dto.customer_id)
      .single()

    if (customerError || !customer) {
      throw new BadRequestException('客户不存在')
    }

    // 计算合计
    const subtotal = dto.items.reduce((sum, item) => sum + item.amount, 0)
    const discount = dto.discount || 0
    const totalAmount = subtotal - discount

    // 生成报价单号
    const quoteNo = await this.generateQuoteNo()

    // 创建报价单
    const { data: quote, error: quoteError } = await client
      .from('quotes')
      .insert({
        quote_no: quoteNo,
        customer_id: dto.customer_id,
        status: 'draft',
        subtotal,
        discount,
        total_amount: totalAmount,
        remark: dto.remark,
        valid_days: dto.valid_days || 30,
      })
      .select()
      .single()

    if (quoteError) {
      console.error('创建报价单失败:', quoteError)
      throw new BadRequestException('创建报价单失败')
    }

    // 创建报价单明细
    const itemsData = dto.items.map((item, index) => ({
      quote_id: quote.id,
      product_id: item.product_id,
      product_name: item.product_name,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount || 0,
      amount: item.amount,
      remark: item.remark,
    }))

    const { error: itemsError } = await client.from('quote_items').insert(itemsData)

    if (itemsError) {
      console.error('创建报价单明细失败:', itemsError)
      // 删除已创建的报价单
      await client.from('quotes').delete().eq('id', quote.id)
      throw new BadRequestException('创建报价单明细失败')
    }

    return this.getById(quote.id)
  }

  /**
   * 更新报价单
   */
  async update(id: string, dto: Partial<CreateQuoteDto>) {
    const client = getSupabaseClient()

    // 验证报价单是否存在
    const existing = await this.getById(id)
    if (existing.status !== 'draft') {
      throw new BadRequestException('只能修改草稿状态的报价单')
    }

    // 如果有更新明细，重新计算合计
    if (dto.items) {
      const subtotal = dto.items.reduce((sum, item) => sum + item.amount, 0)
      const discount = dto.discount || 0
      const totalAmount = subtotal - discount

      // 删除旧明细
      await client.from('quote_items').delete().eq('quote_id', id)

      // 创建新明细
      const itemsData = dto.items.map((item) => ({
        quote_id: id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        amount: item.amount,
        remark: item.remark,
      }))

      const { error: itemsError } = await client.from('quote_items').insert(itemsData)
      if (itemsError) {
        console.error('创建报价单明细失败:', itemsError)
        throw new BadRequestException('创建报价单明细失败')
      }

      // 更新报价单
      const { data, error } = await client
        .from('quotes')
        .update({
          subtotal,
          discount,
          total_amount: totalAmount,
          remark: dto.remark,
          valid_days: dto.valid_days,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('更新报价单失败:', error)
        throw new BadRequestException('更新报价单失败')
      }
    }

    return this.getById(id)
  }

  /**
   * 更新报价单状态
   */
  async updateStatus(id: string, status: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('quotes')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新报价单状态失败:', error)
      throw new BadRequestException('更新报价单状态失败')
    }

    return data
  }

  /**
   * 删除报价单
   */
  async delete(id: string) {
    const client = getSupabaseClient()

    // 删除报价单明细
    await client.from('quote_items').delete().eq('quote_id', id)

    // 删除报价单
    const { error } = await client.from('quotes').delete().eq('id', id)

    if (error) {
      console.error('删除报价单失败:', error)
      throw new BadRequestException('删除报价单失败')
    }

    return { success: true }
  }

  /**
   * 获取统计数据
   */
  async getStats(userId?: string) {
    const client = getSupabaseClient()

    // 获取本月起止时间
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    // 获取总报价数
    const { count: totalQuotes } = await client
      .from('quotes')
      .select('*', { count: 'exact', head: true })

    // 获取本月报价数
    const { count: monthQuotes } = await client
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    // 获取本月成交金额
    const { data: acceptedQuotes } = await client
      .from('quotes')
      .select('total_amount')
      .eq('status', 'accepted')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    const monthAmount = acceptedQuotes?.reduce(
      (sum, q) => sum + parseFloat(q.total_amount),
      0
    ) || 0

    return {
      total_quotes: totalQuotes || 0,
      month_quotes: monthQuotes || 0,
      month_amount: monthAmount,
    }
  }

  /**
   * 生成报价单号
   */
  private async generateQuoteNo(): Promise<string> {
    const date = new Date()
    const prefix = `BJ${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`

    const client = getSupabaseClient()
    const { count, error } = await client
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .like('quote_no', `${prefix}%`)

    if (error) {
      console.error('查询报价单号失败:', error)
    }

    const seq = (count || 0) + 1
    return `${prefix}${String(seq).padStart(4, '0')}`
  }
}
