import { Controller, Get, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  @Get()
  healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'earthquake-rabbitmq-consumer',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
    };

    this.logger.log(`Health check requested: ${health.status}`);
    return health;
  }

  @MessagePattern('consumer.health')
  microserviceHealthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'earthquake-rabbitmq-consumer-microservice',
      uptime: process.uptime(),
    };
  }
}
