import { Controller, Get, Query, Param, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import { CanvasService } from './canvas.service';

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  /**
   * 生成报价单 PDF（Base64 格式）
   * GET /api/canvas/quote/:id
   */
  @Get('quote/:id')
  async generateQuotePDF(
    @Param('id') id: string,
    @Headers('x-openid') userId: string,
  ) {
    try {
      const result = await this.canvasService.generateQuoteImage(id, userId);
      return {
        code: 0,
        msg: 'success',
        data: result,
      };
    } catch (error) {
      console.error('生成PDF失败:', error);
      return {
        code: 500,
        msg: '生成PDF失败: ' + (error as Error).message,
      };
    }
  }
}
