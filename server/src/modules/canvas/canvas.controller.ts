import { Controller, Get, Post, Query, Param, Headers, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { CanvasService } from './canvas.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  /**
   * 生成报价单 PDF
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

  /**
   * 下载 PDF 文件
   * GET /api/canvas/download?path=xxx
   */
  @Get('download')
  async downloadPDF(
    @Query('path') filePath: string,
    @Res() res: Response,
  ) {
    try {
      if (!filePath) {
        return res.status(400).json({
          code: 400,
          msg: '缺少文件路径参数',
        });
      }

      // 安全检查：确保文件路径在临时目录中
      const tempDir = process.env.TEMP || '/tmp';
      const fullPath = path.resolve(filePath);

      if (!fullPath.startsWith(tempDir)) {
        return res.status(403).json({
          code: 403,
          msg: '非法文件路径',
        });
      }

      // 检查文件是否存在
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
          code: 404,
          msg: '文件不存在',
        });
      }

      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(fullPath)}"`);

      // 发送文件
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);

      // 文件发送完成后删除临时文件
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(fullPath);
          console.log('临时文件已删除:', fullPath);
        } catch (error) {
          console.error('删除临时文件失败:', error);
        }
      });
    } catch (error) {
      console.error('下载PDF失败:', error);
      return res.status(500).json({
        code: 500,
        msg: '下载PDF失败',
      });
    }
  }
}
