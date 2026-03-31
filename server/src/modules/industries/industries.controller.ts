import { Controller, Get } from '@nestjs/common'
import { IndustriesService } from './industries.service'

@Controller('industries')
export class IndustriesController {
  constructor(private readonly industriesService: IndustriesService) {}

  /**
   * 获取所有行业
   * GET /api/industries
   */
  @Get()
  async getAll() {
    const industries = await this.industriesService.getAll()
    return industries
  }
}
