import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { MembershipService } from '../membership/membership.service'

@Injectable()
export class ProductsService {
  /**
   * 获取商品列表
   */
  async getAll(userId?: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取商品列表失败:', error)
      throw new BadRequestException('获取商品列表失败')
    }

    return data
  }

  /**
   * 获取单个商品
   */
  async getById(id: string) {
    const client = getSupabaseClient()
    const { data, error } = await client.from('products').select('*').eq('id', id).single()

    if (error) {
      throw new NotFoundException('商品不存在')
    }

    return data
  }

  /**
   * 创建商品（检查数量限制）
   */
  async create(userId: string, productData: {
    industry_id: string
    name: string
    code?: string
    unit: string
    specification?: string
    cost_price?: string
    retail_price: string
    wholesale_price?: string
  }) {
    const client = getSupabaseClient()

    // 检查商品数量限制
    await this.checkProductLimit(userId)

    // 验证行业是否存在
    const { data: industry, error: industryError } = await client
      .from('industries')
      .select('id')
      .eq('id', productData.industry_id)
      .single()

    if (industryError || !industry) {
      throw new BadRequestException('行业不存在')
    }

    const { data, error } = await client
      .from('products')
      .insert({
        ...productData,
        is_active: true,
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
  async update(id: string, productData: Partial<{
    industry_id: string
    name: string
    code: string
    unit: string
    specification: string
    cost_price: string
    retail_price: string
    wholesale_price: string
  }>) {
    const client = getSupabaseClient()

    // 验证商品是否存在
    const existing = await this.getById(id)

    const { data, error } = await client
      .from('products')
      .update({
        ...productData,
        updated_at: new Date().toISOString(),
      })
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

    // 验证商品是否存在
    await this.getById(id)

    const { error } = await client.from('products').update({ is_active: false }).eq('id', id)

    if (error) {
      console.error('删除商品失败:', error)
      throw new BadRequestException('删除商品失败')
    }

    return { success: true }
  }

  /**
   * 检查商品数量限制
   */
  private async checkProductLimit(userId: string) {
    const client = getSupabaseClient()

    // 获取用户权限配置
    const membershipService = new MembershipService()
    const limits = await membershipService.getUserLimits(userId)

    // 如果是无限商品，跳过检查
    if (limits.max_products === -1) {
      return
    }

    // 查询当前商品数量
    const { count, error } = await client
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) {
      console.error('查询商品数量失败:', error)
      throw new BadRequestException('查询商品数量失败')
    }

    if (count !== null && count >= limits.max_products) {
      throw new BadRequestException(`商品数量已达上限（${limits.max_products}个），请升级会员`)
    }
  }
}
