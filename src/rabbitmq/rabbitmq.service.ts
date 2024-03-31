import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Ctx, EventPattern, MessagePattern, Payload, RmqContext, Transport } from '@nestjs/microservices'; // Import Transport
import * as retry from 'retry';
import { rabbitmqConfig } from './rabbitmq.config';
import { EarthquakeDTO } from 'src/earthquake/earthquakeDTO';

@Injectable()
export class RabbitmqService implements OnModuleInit {
  private client: ClientProxy;

  constructor() {}

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry() {
    const operation = retry.operation({
      retries: 10,
      factor: 2,
      minTimeout: 1000,
    });

    operation.attempt(async (currentAttempt) => {
      try {
        this.client = await ClientProxyFactory.create({
          transport: Transport.RMQ, // Specify the transport as RMQ (RabbitMQ)
          options: rabbitmqConfig.options,
        });
        console.log('Connected to RabbitMQ');
      } catch (error) {
        console.error(`Error connecting to RabbitMQ (attempt ${currentAttempt}):`, error);
        if (operation.retry(error)) {
          return;
        }
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }
    });
  }

  async handleMessage(@Payload() data: EarthquakeDTO): Promise<any> {
    try {
      console.log(`Received message: ${JSON.stringify(data)}`);
      // Process the message as needed
      return 'Message processed successfully';
    } catch (error) {
      console.error(`Error processing message: ${error.message}`);
      throw error;
    }
  }
}