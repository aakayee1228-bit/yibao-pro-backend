import { Controller, Get, Param, BadRequestException, Headers, Res } from '@nestjs/common'
import { CanvasService } from './canvas.service'
import { Response } from 'express'

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  /**
   * 生成报价单图片
   * GET /api/canvas/quote/:id
   */
  @Get('quote/:id')
  async generateQuoteImage(@Param('id') id: string, @Res() res: Response) {
    try {
      const imageBuffer = await this.canvasService.generateQuoteImage(id)

      // 设置响应头
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=3600', // 缓存 1 小时
      })

      // 发送图片数据
      res.send(imageBuffer)
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('生成图片失败')
    }
  }
}
