import { Controller, Get, Headers } from '@nestjs/common';
import { CanvasService } from './canvas.service';

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  /**
   * 生成报价单 Excel
   * GET /api/canvas/excel/:id
   */
  @Get('excel/:id')
  async generateExcel(
    @Headers('x-openid') userId: string,
    @Headers('x-open-id') userIdAlt: string,
    @Headers('x-open-id') userIdAlt2: string,
    @Headers('x-open-id') userIdAlt3: string,
  ) {
    try {
      const userIdToUse = userId || userIdAlt || userIdAlt2 || userIdAlt3;
      const result = await this.canvasService.generateExcel(userIdToUse);
      return {
        code: 0,
        msg: 'success',
        data: result,
      };
    } catch (error) {
      console.error('生成Excel失败:', error);
      return {
        code: 500,
        msg: '生成Excel失败: ' + (error as Error).message,
      };
    }
  }

  /**
   * 生成报价单 Word
   * GET /api/canvas/word/:id
   */
  @Get('word/:id')
  async generateWord(
    @Headers('x-openid') userId: string,
    @Headers('x-open-id') userIdAlt: string,
    @Headers('x-open-id') userIdAlt2: string,
    @Headers('x-open-id') userIdAlt3: string,
  ) {
    try {
      const userIdToUse = userId || userIdAlt || userIdAlt2 || userIdAlt3;
      const result = await this.canvasService.generateWord(userIdToUse);
      return {
        code: 0,
        msg: 'success',
        data: result,
      };
    } catch (error) {
      console.error('生成Word失败:', error);
      return {
        code: 500,
        msg: '生成Word失败: ' + (error as Error).message,
      };
    }
  }
}
