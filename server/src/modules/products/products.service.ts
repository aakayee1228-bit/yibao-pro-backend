import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface CreateProductDto {
  name: string
  unit: string
  price: number
  category?: string
}

@Injectable()
export class ProductsService {
  /**
   * 获取商品列表
   */
  async getAll(userId?: string, filters?: { category?: string }) {
    const client = getSupabaseClient()

    let query = client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    // 注意：products 表没有 user_id 字段，暂时不过滤用户数据
    // TODO: 数据库添加 user_id 字段后，重新启用用户过滤

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('获取商品列表失败:', error)
      throw new BadRequestException('获取商品列表失败')
    }

    return products || []
  }

  /**
   * 创建商品
   */
  async create(userId: string, dto: CreateProductDto) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('products')
      .insert({
        ...dto,
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('创建商品失败:', error)
      throw new BadRequestException('创建商品失败')
    }

    return data
  }

  /**
   * 更新商品
   */
  async update(id: string, dto: Partial<CreateProductDto>) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('products')
      .update(dto)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新商品失败:', error)
      throw new BadRequestException('更新商品失败')
    }

    return data
  }

  /**
   * 删除商品
   */
  async delete(id: string) {
    const client = getSupabaseClient()

    const { error } = await client.from('products').delete().eq('id', id)

    if (error) {
      console.error('删除商品失败:', error)
      throw new BadRequestException('删除商品失败')
    }
  }
}
