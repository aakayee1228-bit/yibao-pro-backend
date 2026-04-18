import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface CreateProductDto {
  industry_id?: string
  name: string
  code?: string
  unit: string
  specification?: string
  cost_price?: string
  retail_price: string
  wholesale_price?: string
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
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // 注意：products 表没有 user_id 字段，暂时不过滤用户数据
    // TODO: 数据库添加 user_id 字段后，重新启用用户过滤

    if (filters?.category) {
      query = query.eq('industry_id', filters.category)
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

    // 转换字段名和类型
    const dbData = {
      industry_id: dto.industry_id || 'industry-engineering',
      name: dto.name,
      code: dto.code || null,
      unit: dto.unit,
      specification: dto.specification || null,
      cost_price: dto.cost_price || null,
      retail_price: dto.retail_price,
      wholesale_price: dto.wholesale_price || null,
      is_active: true,
    }

    const { data, error } = await client
      .from('products')
      .insert(dbData)
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

    // 转换字段名和类型
    const updateData: any = {}

    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.code !== undefined) updateData.code = dto.code || null
    if (dto.unit !== undefined) updateData.unit = dto.unit
    if (dto.specification !== undefined) updateData.specification = dto.specification || null
    if (dto.cost_price !== undefined) updateData.cost_price = dto.cost_price || null
    if (dto.retail_price !== undefined) updateData.retail_price = dto.retail_price
    if (dto.wholesale_price !== undefined) updateData.wholesale_price = dto.wholesale_price || null

    const { data, error } = await client
      .from('products')
      .update(updateData)
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
