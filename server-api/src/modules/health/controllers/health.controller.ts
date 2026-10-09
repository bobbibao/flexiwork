import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicRoute } from 'src/shared/decorators';

@Controller('health')
@ApiTags('health')
@PublicRoute()
export class HealthController {
  constructor() {}

  @Get()
  checkHealth() {
    return { status: 'Healthy', timestamp: new Date() };
  }
}
