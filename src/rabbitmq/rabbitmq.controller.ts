import { Controller, Get } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { EventPattern, MessagePattern, Payload, Ctx } from '@nestjs/microservices';
import { EarthquakeDTO } from 'src/earthquake/earthquakeDTO';
import { rabbitmqConfig } from './rabbitmq.config';

@Controller('earthquake')
export class RabbitmqController {
  constructor(private readonly rabbitmqService: RabbitmqService) { }

  @EventPattern('earthquake.new')
  async handleMessage(@Payload() earthquake: any, @Ctx() context: any) {
    // Parse earthquake if it's a string, otherwise use as is
    const earthquakeData = typeof earthquake === 'string' ? JSON.parse(earthquake) : earthquake;

    // Handle the case where the data might be wrapped in a 'data' property (common in some NestJS microservice setups)
    const payload = earthquakeData.data || earthquakeData;

    return this.rabbitmqService.processEarthquakeEvent(payload, context);
  }
}
