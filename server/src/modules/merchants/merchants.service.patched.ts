import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface MerchantInfo {
  company_name: string
  contact_person: string
  contact_phone: string
  contact_address?: string
  contact_email?: string
}

@Injectable()
export class MerchantsService {
  /**
   * 获取商家信息
   */
  async get(userId?: string) {
    const client = getSupabaseClient()

    let query = client
      .from('merchants')
      .select('*')
      .limit(1)
      .single()

    // 添加用户过滤
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('获取商家信息失败:', error)
      // 不抛出异常，返回 null
      return null
    }

    return data
  }

  /**
   * 更新或创建商家信息
   */
  async upsert(userId: string, dto: MerchantInfo) {
    if (!userId) {
      throw new BadRequestException('缺少用户身份信息')
    }

    const client = getSupabaseClient()

    // 先查询是否已有商家信息
    const { data: existing } = await client
      .from('merchants')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single()

    if (existing) {
      // 更新
      const { data, error } = await client
        .from('merchants')
        .update(dto)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('更新商家信息失败:', error)
        throw new BadRequestException('更新商家信息失败')
      }

      return data
    } else {
      // 创建
      const { data, error } = await client
        .from('merchants')
        .insert({
          ...dto,
          user_id: userId,
        })
        .select()
        .single()

      if (error) {
        console.error('创建商家信息失败:', error)
        throw new BadRequestException('创建商家信息失败')
      }

      return data
    }
  }
}
