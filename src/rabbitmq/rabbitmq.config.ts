import { Transport } from "@nestjs/microservices";

export interface RabbitmqConfig {
  transport: Transport,
  options: {
    urls: string[],
    queue: string,
    queueOptions: {
      durable: boolean,
    },
  },
}

export const rabbitmqConfig: RabbitmqConfig = {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://rabbit:rabbit@rabbitmq:5672'], // Replace with your RabbitMQ server URL
    queue: 'earthquake_queue',
    queueOptions: {
      durable: true,
    },
  },
};