import { useEffect, PropsWithChildren } from 'react'
import { getUserOpenid } from '@/utils/auth'

export const AuthProvider = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    // 在应用启动时调用登录
    const initAuth = async () => {
      try {
        const openid = await getUserOpenid()
        console.log('用户 openid:', openid)
      } catch (error) {
        console.error('初始化认证失败:', error)
      }
    }

    initAuth()
  }, [])

  return <>{children}</>
}
