import Taro from '@tarojs/taro'
import { getAuthToken } from '@/utils/auth'

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 如果请求的 url 以 http:// 或 https:// 开头，则不会添加域名前缀
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 * IMPORTANT: 除非你需要添加全局参数，如给所有请求加上 header，否则不能修改此文件
 */
export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${PROJECT_DOMAIN}${url}`
    }

    /**
     * 获取带用户认证的请求头
     */
    const getAuthHeaders = (originalHeaders: Record<string, any> = {}): Record<string, any> => {
        const headers = { ...originalHeaders }

        // 尝试获取用户 openid
        const auth = getAuthToken()
        if (auth && auth.openid) {
            headers['X-Openid'] = auth.openid
        }

        return headers
    }

    export const request: typeof Taro.request = option => {
        const headers = getAuthHeaders(option.header)
        return Taro.request({
            ...option,
            url: createUrl(option.url),
            header: headers,
        })
    }

    export const uploadFile: typeof Taro.uploadFile = option => {
        const headers = getAuthHeaders(option.header)
        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url),
            header: headers,
        })
    }

    export const downloadFile: typeof Taro.downloadFile = option => {
        const headers = getAuthHeaders(option.header)
        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url),
            header: headers,
        })
    }
}
