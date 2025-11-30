// rabbitmq.config.ts
import { Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

// Ensure env vars are loaded if ConfigModule hasn't run yet (e.g. in main.ts)
dotenv.config();

export const rabbitmqConfig = {
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL || 'amqp://rabbit:rabbit@127.0.0.1:42107'],
    queue: 'earthquake_queue',
    queueOptions: { durable: true },
    noAck: false,
    prefetchCount: 1,
    socketOptions: {
      heartbeatIntervalInSeconds: 60,
      reconnectTimeInSeconds: 10,
    },
  },
};
