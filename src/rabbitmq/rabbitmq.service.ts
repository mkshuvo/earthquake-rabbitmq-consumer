import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
import * as retry from 'retry';

@Injectable()
export class RabbitmqService implements OnModuleInit {

  private readonly client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'earthquake_queue',
        queueOptions: {
          durable: false,
        },
      },
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry() {
    const operation = retry.operation({
      retries: 10, // Adjust the number of retries as needed
      factor: 2,
      minTimeout: 1000, // Adjust the timeout as needed
    });

    operation.attempt(async (currentAttempt) => {
      try {
        await this.client.connect();
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

  async handleMessage(message: any): Promise<any> {
    try {
      console.log(`Received message: ${JSON.stringify(message)}`);
      // Process the message as needed
      return 'Message processed successfully';
    } catch (error) {
      console.error(`Error processing message: ${error.message}`);
      // Handle the error accordingly
      throw error;
    }
  }
}
