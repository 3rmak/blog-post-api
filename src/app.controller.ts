import { Controller, Get } from '@nestjs/common';

class HealthCheckResponse {
  message: string;
}

@Controller()
export class AppController {
  @Get('/healthcheck')
  getHello(): HealthCheckResponse {
    return { message: 'alive' };
  }
}
