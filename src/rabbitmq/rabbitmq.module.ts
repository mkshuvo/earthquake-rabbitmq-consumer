import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { rabbitmqConfig } from './rabbitmq.config';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqController } from './rabbitmq.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: rabbitmqConfig.options,
      },
    ]),
  ],
  providers: [RabbitmqService],
  controllers: [RabbitmqController],
})
export class RabbitmqModule {}
