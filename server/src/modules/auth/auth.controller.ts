import { Controller, Post, Get, Put, Body, Query, Headers } from '@nestjs/common'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 微信登录
   * POST /api/auth/wechat/login
   */
  @Post('wechat/login')
  async wechatLogin(@Body('code') code: string) {
    const result = await this.authService.wechatLogin(code)
    return {
      code: 0,
      msg: 'success',
      data: result,
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/user
   */
  @Get('user')
  async getCurrentUser(@Headers('x-user-id') userId: string) {
    // 如果没有用户ID，返回默认用户
    if (!userId) {
      return {
        code: 0,
        msg: 'success',
        data: {
          id: 'default-user',
          nickname: '访客用户',
          avatar: null,
          phone: null,
        },
      }
    }

    const user = await this.authService.getUserById(userId)
    return {
      code: 0,
      msg: 'success',
      data: user,
    }
  }

  /**
   * 更新用户信息
   * PUT /api/auth/user
   */
  @Put('user')
  async updateUser(
    @Headers('x-user-id') userId: string,
    @Body() updateData: { nickname?: string; avatar?: string; phone?: string },
  ) {
    if (!userId) {
      return {
        code: 401,
        msg: '请先登录',
        data: null,
      }
    }

    const user = await this.authService.updateUser(userId, updateData)
    return {
      code: 0,
      msg: 'success',
      data: user,
    }
  }
}
