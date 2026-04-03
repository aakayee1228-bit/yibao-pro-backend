import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { FC } from 'react'
import { FileText, Check } from 'lucide-react-taro'
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
}

const TemplatesPage: FC = () => {
  const templates: Template[] = [
    {
      id: '1',
      name: '标准报价单',
      description: '适用于大多数场景，简洁清晰',
      isPremium: false,
      features: ['基础信息展示', '商品明细', '合计金额'],
    },
    {
      id: '2',
      name: '详细报价单',
      description: '包含更多细节，适合复杂项目',
      isPremium: true,
      features: ['公司Logo', '商品图片', '备注说明', '条款声明'],
    },
    {
      id: '3',
      name: '专业报价单',
      description: '高端设计，适合正式场合',
      isPremium: true,
      features: ['精美排版', '企业印章', '多语言支持', '自定义字段'],
    },
  ]

  // 使用模板
  const handleUseTemplate = (template: Template) => {
    if (template.isPremium) {
      // 高级模板提示即将上线
      Taro.showToast({
        title: '高级模板即将上线',
        icon: 'none',
      })
      return
    }

    // 免费模板直接使用
    Taro.showToast({
      title: `已选择${template.name}`,
      icon: 'success',
    })
    // TODO: 跳转到报价单创建页面
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
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-2">
                    <FileText size={20} color="#2563eb" />
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </View>
                  {template.isPremium ? (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                      即将上线
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500 text-white">免费</Badge>
                  )}
                </View>
              </CardHeader>
              <CardContent className="pt-0">
                <Text className="block text-sm text-gray-500 mb-3">{template.description}</Text>
                <View className="flex flex-col gap-2">
                  {template.features.map((feature, index) => (
                    <View key={index} className="flex items-center gap-2">
                      <Check size={14} color={template.isPremium ? '#9ca3af' : '#10b981'} />
                      <Text className="text-xs text-gray-600">{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* 操作按钮 */}
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    className="w-full border-blue-500 text-blue-500"
                    variant="outline"
                    onClick={() => handleUseTemplate(template)}
                  >
                    {template.isPremium ? '敬请期待' : '使用此模板'}
                  </Button>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      </View>

      {/* 底部提示 */}
      <View className="p-4 bg-white border-t border-gray-100">
        <Text className="block text-xs text-gray-400 text-center">
          更多模板持续开发中
        </Text>
      </View>
    </View>
  )
}

export default TemplatesPage
