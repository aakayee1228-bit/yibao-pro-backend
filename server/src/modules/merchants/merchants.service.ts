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
      .from('merchant_info')
      .select('*')

    // 注意：merchant_info 表没有 user_id 字段，暂时不过滤用户数据
    // TODO: 数据库添加 user_id 字段后，重新启用用户过滤

    query = query.limit(1)

    const { data, error } = await query.single()

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
  async upsert(userId: string | undefined, dto: MerchantInfo) {
    const client = getSupabaseClient()

    // 先查询是否已有商家信息
    const { data: existing } = await client
      .from('merchant_info')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (existing) {
      // 更新
      const { data, error } = await client
        .from('merchant_info')
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
        .from('merchant_info')
        .insert(dto)
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
