import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class IndustriesService {
  /**
   * 获取所有行业
   */
  async getAll() {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('industries')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('获取行业列表失败:', error)
      throw new BadRequestException('获取行业列表失败')
    }

    return data
  }

  /**
   * 获取单个行业
   */
  async getById(id: string) {
    const client = getSupabaseClient()
    const { data, error } = await client.from('industries').select('*').eq('id', id).single()

    if (error) {
      throw new NotFoundException('行业不存在')
    }

    return data
  }
}
