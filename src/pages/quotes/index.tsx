import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Plus, FileText, ChevronRight, Pencil, Trash2 } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import './index.css'

interface Customer {
  id: string
  name: string
  phone: string
}

interface Quote {
  id: string
  quote_no: string
  customer_id: string
  status: string
  subtotal: number
  discount: number
  total_amount: number
  remark: string
  valid_days: number
  created_at: string
  customers: Customer | null
}

const QuotesPage: FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useDidShow(() => {
    fetchQuotes()
  })

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/quotes',
        method: 'GET',
      })

      console.log('获取表单列表响应:', res.statusCode, res.data)

      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: Quote[] }
        setQuotes(responseData.data || [])
      }
    } catch (err) {
      console.error('获取表单列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: '草稿', variant: 'secondary' },
      sent: { label: '已发送', variant: 'default' },
      accepted: { label: '已成交', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
    }
    return statusMap[status] || { label: status, variant: 'secondary' }
  }

  const handleCreate = () => {
    Taro.navigateTo({ url: '/pages/quotes/create/index' })
  }

  const handleDetail = (quote: Quote) => {
    Taro.navigateTo({ url: `/pages/quotes/detail/index?id=${quote.id}` })
  }

  const handleEdit = (quote: Quote) => {
    Taro.navigateTo({ url: `/pages/quotes/edit/index?id=${quote.id}` })
  }

  const handleDelete = (quote: Quote) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除此表单吗？删除后无法恢复。`,
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          setDeleting(quote.id)
          try {
            const result = await Network.request({
              url: `/api/quotes/${quote.id}`,
              method: 'DELETE',
            })

            console.log('删除表单响应:', result.data)

            if (result.data?.code === 0 || result.data?.code === 200) {
              Taro.showToast({ title: '删除成功', icon: 'success' })
              fetchQuotes()
            } else {
              Taro.showToast({ title: result.data?.msg || '删除失败', icon: 'none' })
            }
          } catch (err) {
            console.error('删除表单失败:', err)
            Taro.showToast({ title: '删除失败', icon: 'none' })
          } finally {
            setDeleting(null)
          }
        }
      },
    })
  }

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-12 pb-6">
        <View className="flex items-center justify-between">
          <View>
            <Text className="block text-xl font-bold text-white">我的表单</Text>
            <Text className="block text-sm text-blue-100 mt-1">
              共 {quotes.length} 份表单
            </Text>
          </View>
          <View
            className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center"
            onClick={handleCreate}
          >
            <Plus size={20} color="#ffffff" />
          </View>
        </View>
      </View>

      {/* 表单列表 */}
      <View className="flex-1 p-4">
        {loading ? (
          <View className="text-center py-12">
            <Text className="text-sm text-gray-400">加载中...</Text>
          </View>
        ) : quotes.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16">
            <FileText size={48} color="#d1d5db" />
            <Text className="block text-sm text-gray-400 mt-4">暂无表单</Text>
            <Text className="block text-xs text-gray-400 mt-1">点击右上角 + 创建新表单</Text>
            <Button className="mt-4" onClick={handleCreate}>
              创建表单
            </Button>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {quotes.map((quote) => {
              const statusInfo = getStatusBadge(quote.status)
              const isDeleting = deleting === quote.id
              return (
                <Card 
                  key={quote.id}
                  onClick={() => handleDetail(quote)}
                >
                  <CardContent className="p-4">
                    <View className="flex items-start justify-between">
                      <View className="flex-1">
                        <View className="flex items-center gap-2">
                          <Text className="text-sm font-medium text-gray-900">
                            {quote.customers?.name || '未知客户'}
                          </Text>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </View>
                        <Text className="text-xs text-gray-500 mt-1">
                          单号：{quote.quote_no}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-1">
                          {quote.created_at ? new Date(quote.created_at).toLocaleDateString('zh-CN') : ''}
                        </Text>
                      </View>
                      <View className="text-right">
                        <Text className="text-lg font-bold text-blue-600">
                          ¥{Number(quote.total_amount).toFixed(2)}
                        </Text>
                        <View className="flex items-center justify-end mt-2">
                          <Text className="text-xs text-gray-400">查看详情</Text>
                          <ChevronRight size={14} color="#9ca3af" />
                        </View>
                      </View>
                    </View>

                    {/* 操作按钮 - 仅草稿状态显示 */}
                    {quote.status === 'draft' && (
                      <View 
                        className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100"
                        onClick={(e) => {
                          e.stopPropagation?.()
                        }}
                      >
                        <View
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation?.()
                            handleEdit(quote)
                          }}
                        >
                          <Pencil size={14} color="#2563eb" />
                          <Text className="text-xs text-blue-500">编辑</Text>
                        </View>
                        <View
                          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded ${
                            isDeleting ? 'bg-gray-200' : 'bg-gray-100'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation?.()
                            if (!isDeleting) handleDelete(quote)
                          }}
                        >
                          <Trash2 size={14} color={isDeleting ? '#9ca3af' : '#ef4444'} />
                          <Text className={`text-xs ${isDeleting ? 'text-gray-400' : 'text-red-500'}`}>
                            {isDeleting ? '删除中...' : '删除'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}

export default QuotesPage
