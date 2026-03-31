import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

interface User {
  id: string
  openid: string
  nickname: string
  avatar: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

interface UserState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
  login: (code: string) => Promise<User | null>
  fetchUserInfo: () => Promise<User | null>
}

// Taro 存储适配器
const taroStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const { data } = await Taro.getStorage({ key: name })
      return data
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Taro.setStorage({ key: name, data: value })
  },
  removeItem: async (name: string): Promise<void> => {
    await Taro.removeStorage({ key: name })
  },
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      setUser: (user) => set({ user, isLoggedIn: !!user }),

      setToken: (token) => set({ token }),

      logout: () => {
        set({ user: null, token: null, isLoggedIn: false })
      },

      login: async (code: string) => {
        try {
          const { Network } = await import('@/network')
          const res = await Network.request({
            url: '/api/auth/wechat/login',
            method: 'POST',
            data: { code },
          })

          console.log('登录响应:', res)

          if (res.statusCode === 200 && res.data) {
            const responseData = res.data as { data?: { user: User; isNewUser: boolean } }
            const userData = responseData.data?.user
            if (userData) {
              set({ user: userData, isLoggedIn: true })
              return userData
            }
          }
          return null
        } catch (err) {
          console.error('登录失败:', err)
          return null
        }
      },

      fetchUserInfo: async () => {
        const { user } = get()
        if (!user?.id) return null

        try {
          const { Network } = await import('@/network')
          const res = await Network.request({
            url: '/api/auth/user',
            method: 'GET',
            header: { 'x-user-id': user.id },
          })

          if (res.statusCode === 200 && res.data) {
            const responseData = res.data as { data?: User }
            const userData = responseData.data
            if (userData) {
              set({ user: userData })
              return userData
            }
          }
          return null
        } catch (err) {
          console.error('获取用户信息失败:', err)
          return null
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isLoggedIn: state.isLoggedIn }),
    },
  ),
)
