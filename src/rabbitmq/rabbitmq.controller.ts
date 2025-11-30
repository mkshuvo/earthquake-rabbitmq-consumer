import { Controller, Get } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import {
  EventPattern,
  MessagePattern,
  Payload,
  Ctx,
} from '@nestjs/microservices';
import { EarthquakeDTO } from 'src/earthquake/earthquakeDTO';
import { rabbitmqConfig } from './rabbitmq.config';

@Controller('earthquake')
export class RabbitmqController {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  // Listen to earthquake.new pattern from direct AMQP messages
  @EventPattern('earthquake.new')
  async handleNewEarthquake(@Payload() data: any, @Ctx() context: any) {
    console.log(
      '\n[RabbitmqController] Received earthquake event:',
      JSON.stringify(data).substring(0, 200),
    );

    // Handle both direct AMQP messages and NestJS microservice format
    let earthquakes = data?.data || data?.earthquakes || data;

    // If it's a single earthquake object, wrap in array
    if (!Array.isArray(earthquakes)) {
      earthquakes = [earthquakes];
    }

    // Process each earthquake
    for (const earthquake of earthquakes) {
      await this.rabbitmqService.processEarthquakeEvent(earthquake, context);
    }
  }
}
