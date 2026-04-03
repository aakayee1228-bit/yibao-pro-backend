import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { FileText, Check, Lock, CircleCheck } from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import './index.css'

interface Template {
  id: string
  name: string
  description: string
  isPremium: boolean
  features: string[]
  unlocked?: boolean
}

const TemplatesPage: FC = () => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: '标准报价单',
      description: '适用于大多数场景，简洁清晰',
      isPremium: false,
      features: ['基础信息展示', '商品明细', '合计金额'],
      unlocked: true,
    },
    {
      id: '2',
      name: '详细报价单',
      description: '包含更多细节，适合复杂项目',
      isPremium: true,
      features: ['公司Logo', '商品图片', '备注说明', '条款声明'],
      unlocked: false,
    },
    {
      id: '3',
      name: '专业报价单',
      description: '高端设计，适合正式场合',
      isPremium: true,
      features: ['精美排版', '企业印章', '多语言支持', '自定义字段'],
      unlocked: false,
    },
  ])

  useEffect(() => {
    loadUnlockedTemplates()
  }, [])

  // 从本地存储加载已解锁的模板
  const loadUnlockedTemplates = () => {
    const unlockedIds = Taro.getStorageSync('unlocked_templates') || []
    setTemplates((prev) =>
      prev.map((t) => ({
        ...t,
        unlocked: !t.isPremium || unlockedIds.includes(t.id),
      }))
    )
  }

  // 观看广告解锁模板
  const handleUnlockTemplate = (template: Template) => {
    if (!template.isPremium || template.unlocked) {
      return
    }

    Taro.showModal({
      title: '观看广告解锁模板',
      content: `观看广告后可永久使用「${template.name}」模板`,
      confirmText: '观看广告',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 模拟观看广告（真实环境需要接入微信广告组件）
          Taro.showLoading({ title: '加载广告中...', mask: true })

          setTimeout(() => {
            Taro.hideLoading()
            Taro.showToast({
              title: '广告观看完成',
              icon: 'success',
              duration: 1500,
            })

            // 解锁模板
            const unlockedIds = Taro.getStorageSync('unlocked_templates') || []
            if (!unlockedIds.includes(template.id)) {
              unlockedIds.push(template.id)
              Taro.setStorageSync('unlocked_templates', unlockedIds)
            }

            // 更新状态
            setTemplates((prev) =>
              prev.map((t) => ({
                ...t,
                unlocked: !t.isPremium || unlockedIds.includes(t.id),
              }))
            )
          }, 2000)
        }
      },
    })
  }

  // 使用模板
  const handleUseTemplate = (template: Template) => {
    if (template.isPremium && !template.unlocked) {
      handleUnlockTemplate(template)
      return
    }

    Taro.showToast({
      title: `已选择${template.name}`,
      icon: 'success',
    })

    // TODO: 跳转到报价单创建页面，带上模板ID
    // Taro.navigateTo({ url: `/pages/quotes/create/index?templateId=${template.id}` })
  }

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部说明 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-12 pb-6">
        <Text className="block text-xl font-bold text-white">报价单模板</Text>
        <Text className="block text-sm text-blue-100 mt-1">选择合适的模板，生成专业报价单</Text>
      </View>

      {/* 模板列表 */}
      <View className="flex-1 p-4">
        <View className="flex flex-col gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={template.isPremium && !template.unlocked ? 'opacity-90' : ''}
            >
              <CardHeader className="pb-2">
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-2">
                    <FileText
                      size={20}
                      color={template.isPremium && !template.unlocked ? '#9ca3af' : '#2563eb'}
                    />
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </View>
                  {template.isPremium && !template.unlocked && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                      <Lock size={12} color="#6b7280" className="mr-1" />
                      高级
                    </Badge>
                  )}
                  {template.isPremium && template.unlocked && (
                    <Badge className="bg-blue-500 text-white">
                      <CircleCheck size={12} color="#fff" className="mr-1" />
                      已解锁
                    </Badge>
                  )}
                  {!template.isPremium && (
                    <Badge className="bg-green-500 text-white">免费</Badge>
                  )}
                </View>
              </CardHeader>
              <CardContent className="pt-0">
                <Text className="block text-sm text-gray-500 mb-3">{template.description}</Text>
                <View className="flex flex-col gap-2">
                  {template.features.map((feature, index) => (
                    <View key={index} className="flex items-center gap-2">
                      <Check
                        size={14}
                        color={template.isPremium && !template.unlocked ? '#9ca3af' : '#10b981'}
                      />
                      <Text className="text-xs text-gray-600">{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* 操作按钮 */}
                <View className="mt-3 pt-3 border-t border-gray-100">
                  {template.isPremium && !template.unlocked ? (
                    <Button
                      size="sm"
                      className="w-full bg-blue-500 text-white"
                      onClick={() => handleUnlockTemplate(template)}
                    >
                      <Lock size={14} color="#fff" className="mr-2" />
                      观看广告解锁
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-blue-500 text-blue-500"
                      onClick={() => handleUseTemplate(template)}
                    >
                      使用此模板
                    </Button>
                  )}
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      </View>

      {/* 底部提示 */}
      <View className="p-4 bg-white border-t border-gray-100">
        <Text className="block text-xs text-gray-400 text-center">
          观看广告即可永久使用高级模板
        </Text>
      </View>
    </View>
  )
}

export default TemplatesPage
