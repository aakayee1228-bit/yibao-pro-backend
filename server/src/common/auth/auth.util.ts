/**
 * 用户身份认证工具
 * 从请求头中获取用户 openid
 */

export interface UserInfo {
  openid: string
  appid?: string
}

/**
 * 从请求头中提取用户信息
 * 小程序端会在请求头中添加 X-Openid
 */
export function extractUserInfo(headers: Record<string, string>): UserInfo | null {
  const openid = headers['x-openid'] || headers['x-user-id']

  if (!openid) {
    return null
  }

  return {
    openid,
    appid: headers['x-appid'],
  }
}

/**
 * 验证用户身份中间件装饰器
 */
export function RequireAuth() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // 获取请求对象（第一个参数通常是 request）
      const request = args[0]

      // 从请求头中提取用户信息
      const userInfo = extractUserInfo(request.headers || {})

      if (!userInfo || !userInfo.openid) {
        throw new Error('未授权：缺少用户身份信息')
      }

      // 将用户信息附加到请求对象上
      request.user = userInfo

      // 调用原始方法
      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}
