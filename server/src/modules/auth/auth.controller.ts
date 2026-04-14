import { Controller, Post, Body, Get, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import axios from 'axios'

/**
 * 用户认证控制器
 */

interface LoginRequest {
  code: string
}

interface WechatLoginResponse {
  openid: string
  session_key: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

@Controller('auth')
export class AuthController {
  /**
   * 小程序登录接口
   * 使用微信 code 换取 openid
   */
  @Post('login')
  async login(@Body() loginRequest: LoginRequest, @Req() req: Request) {
    const { code } = loginRequest

    if (!code) {
      return {
        code: 400,
        msg: '缺少 code 参数',
      }
    }

    try {
      // 从环境变量中获取小程序 AppID 和 AppSecret
      const appId = process.env.WECHAT_MINI_APP_ID || ''
      const appSecret = process.env.WECHAT_MINI_APP_SECRET || ''

      if (!appId || !appSecret) {
        return {
          code: 500,
          msg: '未配置小程序 AppID 或 AppSecret',
        }
      }

      // 调用微信接口，用 code 换取 openid
      const wechatResponse = await axios.get<WechatLoginResponse>(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
      )

      const wechatData = wechatResponse.data

      if (wechatData.errcode) {
        return {
          code: 400,
          msg: `微信登录失败: ${wechatData.errmsg}`,
        }
      }

      // 返回 openid
      return {
        code: 0,
        msg: 'success',
        data: {
          openid: wechatData.openid,
          sessionKey: wechatData.session_key,
          unionid: wechatData.unionid,
        },
      }
    } catch (error) {
      console.error('登录失败:', error)
      return {
        code: 500,
        msg: '登录失败',
      }
    }
  }

  /**
   * 获取当前用户信息
   */
  @Get('user')
  async getCurrentUser(@Req() req: Request) {
    const openid = req.headers['x-openid'] as string

    if (!openid) {
      return {
        code: 401,
        msg: '未授权',
      }
    }

    return {
      code: 0,
      msg: 'success',
      data: {
        openid,
      },
    }
  }
}
