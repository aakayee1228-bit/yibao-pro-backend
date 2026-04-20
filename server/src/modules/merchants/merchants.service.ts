import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface MerchantInfo {
  shop_name: string
  contact_name: string
  phone: string
  address?: string
  email?: string
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
  async upsert(userId: string | undefined, dto: any) {
    const client = getSupabaseClient()

    console.log('[商家信息] 收到更新请求，原始数据:', dto)

    // 转换前端字段名到数据库字段名
    const dbData = {
      shop_name: dto.company_name || dto.shop_name,
      contact_name: dto.contact_person || dto.contact_name,
      phone: dto.contact_phone || dto.phone,
      address: dto.contact_address || dto.address,
      email: dto.contact_email || dto.email,
    }

    console.log('[商家信息] 转换后的数据:', dbData)

    // 先查询是否已有商家信息
    const { data: existing } = await client
      .from('merchant_info')
      .select('id')
      .limit(1)
      .maybeSingle()

    console.log('[商家信息] 现有商家信息ID:', existing?.id)

    if (existing) {
      // 更新
      console.log('[商家信息] 执行更新操作，更新数据:', dbData)
      const { data, error } = await client
        .from('merchant_info')
        .update(dbData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('[商家信息] 更新失败:', error)
        throw new BadRequestException('更新商家信息失败')
      }

      console.log('[商家信息] 更新成功，返回的数据:', data)
      return data
    } else {
      // 创建
      console.log('[商家信息] 执行创建操作，插入数据:', dbData)
      const { data, error } = await client
        .from('merchant_info')
        .insert(dbData)
        .select()
        .single()

      if (error) {
        console.error('[商家信息] 创建失败:', error)
        throw new BadRequestException('创建商家信息失败')
      }

      console.log('[商家信息] 创建成功，返回的数据:', data)
      return data
    }
  }
}
