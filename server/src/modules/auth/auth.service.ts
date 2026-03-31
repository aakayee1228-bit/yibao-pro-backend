import { Injectable, UnauthorizedException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class AuthService {
  /**
   * 微信登录
   */
  async wechatLogin(code: string) {
    const client = getSupabaseClient()

    // 获取微信 openid
    const openid = await this.getWechatOpenid(code)

    // 查找或创建用户
    const { data: existingUser, error: findError } = await client
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single()

    if (existingUser && !findError) {
      // 更新最后登录时间
      const { data: updatedUser, error: updateError } = await client
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('更新登录时间失败:', updateError)
      }

      return {
        user: updatedUser || existingUser,
        isNewUser: false,
      }
    }

    // 创建新用户
    const { data: newUser, error: createError } = await client
      .from('users')
      .insert({
        openid,
        nickname: '微信用户',
        is_active: true,
        last_login_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('创建用户失败:', createError)
      throw new UnauthorizedException('创建用户失败')
    }

    return {
      user: newUser,
      isNewUser: true,
    }
  }

  /**
   * 获取微信 openid
   */
  private async getWechatOpenid(code: string): Promise<string> {
    const appid = process.env.WECHAT_APPID
    const secret = process.env.WECHAT_SECRET

    if (!appid || !secret) {
      // 开发环境：使用 code 模拟 openid
      console.warn('微信配置缺失，使用模拟登录')
      return `dev_openid_${code}`
    }

    try {
      const response = await fetch(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`,
      )
      const data = await response.json()

      if (data.errcode) {
        console.error('微信登录失败:', data)
        throw new UnauthorizedException('微信登录失败')
      }

      return data.openid
    } catch (error) {
      console.error('获取 openid 失败:', error)
      throw new UnauthorizedException('获取用户信息失败')
    }
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client.from('users').select('*').eq('id', userId).single()

    if (error) {
      throw new UnauthorizedException('用户不存在')
    }

    return data
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, updateData: { nickname?: string; avatar?: string; phone?: string }) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('更新用户信息失败:', error)
      throw new UnauthorizedException('更新用户信息失败')
    }

    return data
  }
}
