import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface CreateCustomerDto {
  name: string
  phone: string
  address?: string
  company?: string
}

@Injectable()
export class CustomersService {
  /**
   * 获取客户列表
   */
  async getAll(userId?: string) {
    const client = getSupabaseClient()

    let query = client
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    // 注意：customers 表没有 user_id 字段，暂时不过滤用户数据
    // TODO: 数据库添加 user_id 字段后，重新启用用户过滤

    const { data: customers, error } = await query

    if (error) {
      console.error('获取客户列表失败:', error)
      throw new BadRequestException('获取客户列表失败')
    }

    return customers || []
  }

  /**
   * 创建客户
   */
  async create(userId: string, dto: CreateCustomerDto) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('customers')
      .insert({
        ...dto,
        // 注意：customers 表没有 user_id 字段，暂时不插入
        // TODO: 数据库添加 user_id 字段后，重新启用用户过滤
      })
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
  async update(id: string, dto: Partial<CreateCustomerDto>) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('customers')
      .update(dto)
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

    const { error } = await client.from('customers').delete().eq('id', id)

    if (error) {
      console.error('删除客户失败:', error)
      throw new BadRequestException('删除客户失败')
    }
  }
}
