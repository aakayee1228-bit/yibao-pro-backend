import { Controller, Post, Body } from '@nestjs/common'
import { Config, LLMClient, type Message } from 'coze-coding-dev-sdk'

@Controller('analyze')
export class AnalyzeController {
  private config = new Config()
  private client = new LLMClient(this.config)

  /**
   * 分析图片样式
   * POST /api/analyze/image-style
   */
  @Post('image-style')
  async analyzeImageStyle(@Body() body: { imageUrl: string }) {
    try {
      const { imageUrl } = body

      if (!imageUrl) {
        return {
          code: 400,
          message: 'imageUrl is required'
        }
      }

      const messages: Message[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `请详细分析这个报价单/表单的样式特点，包括：
1. 整体布局风格（卡片式/表格式/混合式）
2. 颜色方案（主色调、背景色、文字颜色）
3. 字体大小和排版（标题、正文、价格的字体大小）
4. 各个区域的布局方式（客户信息、商品明细、金额汇总）
5. 特殊设计元素（线条、边框、阴影、水印等）
6. 整体视觉风格（简约/正式/活泼/商务）

请用结构化的方式返回分析结果，方便用于重构表单样式。`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ]

      const response = await this.client.invoke(messages, {
        model: 'doubao-seed-1-6-vision-250815',
        temperature: 0.3
      })

      return {
        code: 0,
        message: 'success',
        data: {
          analysis: response.content
        }
      }
    } catch (error: any) {
      console.error('分析图片失败:', error)
      return {
        code: 500,
        message: error.message || '分析失败'
      }
    }
  }
}
