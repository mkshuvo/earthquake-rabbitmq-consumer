import { Controller, Get } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EarthquakeDTO } from 'src/earthquake/earthquakeDTO';
import { rabbitmqConfig } from './rabbitmq.config';

@Controller('earthquake')
export class RabbitmqController {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @EventPattern(rabbitmqConfig.options.queue)
  handleMessage(@Payload() earthquake: EarthquakeDTO) {
    return this.rabbitmqService.handleMessage(earthquake);
  }
}
