import Taro from '@tarojs/taro'
import { Network } from '@/network'

/**
 * 用户登录模块
 * 获取用户的 openid 和 session_key
 */

interface LoginResult {
  openid: string
  sessionKey: string
  unionid?: string
}

interface AuthToken {
  openid: string
  token: string
  expiresAt: number
}

const AUTH_KEY = 'yibao_auth_token'

/**
 * 获取本地存储的认证信息
 */
export function getAuthToken(): AuthToken | null {
  try {
    const authStr = Taro.getStorageSync(AUTH_KEY)
    if (!authStr) return null

    const auth = JSON.parse(authStr) as AuthToken

    // 检查是否过期
    if (Date.now() > auth.expiresAt) {
      clearAuthToken()
      return null
    }

    return auth
  } catch (error) {
    console.error('获取认证信息失败:', error)
    return null
  }
}

/**
 * 保存认证信息到本地存储
 */
export function saveAuthToken(auth: AuthToken): void {
  try {
    Taro.setStorageSync(AUTH_KEY, JSON.stringify(auth))
  } catch (error) {
    console.error('保存认证信息失败:', error)
  }
}

/**
 * 清除认证信息
 */
export function clearAuthToken(): void {
  try {
    Taro.removeStorageSync(AUTH_KEY)
  } catch (error) {
    console.error('清除认证信息失败:', error)
  }
}

/**
 * 获取用户 openid
 */
export async function getUserOpenid(): Promise<string | null> {
  // 先尝试从本地存储获取
  const auth = getAuthToken()
  if (auth && auth.openid) {
    return auth.openid
  }

  // 本地没有，调用后端登录接口获取
  try {
    const result = await login()
    return result.openid
  } catch (error) {
    console.error('获取用户 openid 失败:', error)
    return null
  }
}

/**
 * 用户登录
 */
export async function login(): Promise<LoginResult> {
  try {
    // 1. 调用 wx.login 获取 code
    const { code } = await Taro.login()

    console.log('登录 code:', code)

    // 2. 调用后端接口，用 code 换取 openid
    const response = await Network.request({
      url: '/api/auth/login',
      method: 'POST',
      data: { code },
    })

    console.log('登录响应:', response)
    console.log('响应数据详情:', JSON.stringify(response.data, null, 2))

    if (response.statusCode !== 200 || !response.data || response.data.code !== 0) {
      console.error('登录失败，后端返回:', response.data)
      throw new Error('登录失败')
    }

    const loginResult = response.data.data as LoginResult

    // 3. 保存认证信息（有效期 30 天）
    const auth: AuthToken = {
      openid: loginResult.openid,
      token: loginResult.openid, // 暂时使用 openid 作为 token
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    }

    saveAuthToken(auth)

    return loginResult
  } catch (error) {
    console.error('登录异常:', error)
    throw error
  }
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  const auth = getAuthToken()
  return !!auth && !!auth.openid
}

/**
 * 退出登录
 */
export function logout(): void {
  clearAuthToken()
}
