import { Controller, Get } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EarthquakeDTO } from 'src/earthquake/earthquakeDTO';
import { rabbitmqConfig } from './rabbitmq.config';

@Controller('earthquake')
export class RabbitmqController {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @EventPattern('earthquake_queue')
  handleMessage(earthquake: any) {
    return this.rabbitmqService.handleMessage(JSON.stringify(earthquake));
  }
}
