import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class CustomersService {
  /**
   * 获取客户列表
   */
  async getAll(userId?: string, search?: string) {
    const client = getSupabaseClient()
    
    let query = client
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('获取客户列表失败:', error)
      throw new BadRequestException('获取客户列表失败')
    }

    return data
  }

  /**
   * 获取单个客户
   */
  async getById(id: string) {
    const client = getSupabaseClient()
    const { data, error } = await client.from('customers').select('*').eq('id', id).single()

    if (error) {
      throw new NotFoundException('客户不存在')
    }

    return data
  }

  /**
   * 创建客户
   */
  async create(userId: string, customerData: {
    name: string
    phone?: string
    address?: string
    company?: string
    remark?: string
    tags?: string[]
  }) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('customers')
      .insert(customerData)
      .select()
      .single()

    if (error) {
      console.error('创建客户失败:', error)
      throw new BadRequestException('创建客户失败')
    }

    return data
  }

  /**
   * 更新客户
   */
  async update(id: string, customerData: Partial<{
    name: string
    phone: string
    address: string
    company: string
    remark: string
    tags: string[]
  }>) {
    const client = getSupabaseClient()

    // 验证客户是否存在
    await this.getById(id)

    const { data, error } = await client
      .from('customers')
      .update({
        ...customerData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新客户失败:', error)
      throw new BadRequestException('更新客户失败')
    }

    return data
  }

  /**
   * 删除客户
   */
  async delete(id: string) {
    const client = getSupabaseClient()

    // 验证客户是否存在
    await this.getById(id)

    const { error } = await client.from('customers').delete().eq('id', id)

    if (error) {
      console.error('删除客户失败:', error)
      throw new BadRequestException('删除客户失败')
    }

    return { success: true }
  }
}
