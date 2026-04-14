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

    console.log('收到登录请求，code:', code)

    if (!code) {
      console.error('缺少 code 参数')
      return {
        code: 400,
        msg: '缺少 code 参数',
      }
    }

    try {
      // 从环境变量中获取小程序 AppID 和 AppSecret
      const appId = process.env.WECHAT_MINI_APP_ID || ''
      const appSecret = process.env.WECHAT_MINI_APP_SECRET || ''

      console.log('环境变量配置:')
      console.log('- WECHAT_MINI_APP_ID:', appId ? '已配置' : '未配置')
      console.log('- WECHAT_MINI_APP_SECRET:', appSecret ? '已配置' : '未配置')

      if (!appId || !appSecret) {
        console.error('未配置小程序 AppID 或 AppSecret')
        return {
          code: 500,
          msg: '未配置小程序 AppID 或 AppSecret',
        }
      }

      // 调用微信接口，用 code 换取 openid
      const wechatUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
      console.log('调用微信接口:', wechatUrl.replace(appSecret, '***'))

      const wechatResponse = await axios.get<WechatLoginResponse>(wechatUrl)

      const wechatData = wechatResponse.data
      console.log('微信接口返回:', JSON.stringify(wechatData, null, 2))

      if (wechatData.errcode) {
        console.error('微信登录失败，errcode:', wechatData.errcode, 'errmsg:', wechatData.errmsg)
        return {
          code: 400,
          msg: `微信登录失败: ${wechatData.errmsg}`,
        }
      }

      console.log('登录成功，openid:', wechatData.openid)

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
