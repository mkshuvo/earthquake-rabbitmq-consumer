// rabbitmq.config.ts
import { Transport } from "@nestjs/microservices";

export const rabbitmqConfig = {
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL],
    queue: 'earthquake_queue',
    queueOptions: { durable: true },
  },
};
