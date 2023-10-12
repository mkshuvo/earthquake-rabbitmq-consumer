// rabbitmq.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService implements OnModuleInit {

  private readonly client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://rabbit:rabbit@172.20.0.3:5672'],
        queue: 'nestjs_queue',
        queueOptions: {
          durable: false,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
    }
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
