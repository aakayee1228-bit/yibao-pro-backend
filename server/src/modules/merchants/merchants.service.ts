import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class MerchantsService {
  /**
   * 获取商家信息（单例模式，只返回第一条记录）
   */
  async getMerchantInfo() {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('merchant_info')
      .select('*')
      .limit(1)

    if (error) {
      console.error('获取商家信息失败:', error)
      return null
    }

    return data?.[0] || null
  }

  /**
   * 创建或更新商家信息
   */
  async upsertMerchantInfo(data: {
    shopName?: string
    contactName?: string
    phone?: string
    address?: string
    logo?: string
    stamp?: string
  }) {
    const client = getSupabaseClient()

    // 先查询是否存在
    const existing = await this.getMerchantInfo()

    if (existing) {
      // 更新
      const { data: result, error } = await client
        .from('merchant_info')
        .update({
          shop_name: data.shopName,
          contact_name: data.contactName,
          phone: data.phone,
          address: data.address,
          logo: data.logo,
          stamp: data.stamp,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('更新商家信息失败:', error)
        throw new Error('更新商家信息失败')
      }

      return result
    } else {
      // 创建
      const { data: result, error } = await client
        .from('merchant_info')
        .insert({
          shop_name: data.shopName || '我的店铺',
          contact_name: data.contactName || '联系人',
          phone: data.phone || '',
          address: data.address || '',
          logo: data.logo || '',
          stamp: data.stamp || '',
        })
        .select()
        .single()

      if (error) {
        console.error('创建商家信息失败:', error)
        throw new Error('创建商家信息失败')
      }

      return result
    }
  }

  /**
   * 更新商家名称
   */
  async updateShopName(shopName: string) {
    return this.upsertMerchantInfo({ shopName })
  }

  /**
   * 更新联系电话
   */
  async updatePhone(phone: string) {
    return this.upsertMerchantInfo({ phone })
  }
}
