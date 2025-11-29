import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://rabbit:rabbit@localhost:42107'],
        queue: 'earthquake_queue',
        queueOptions: {
          durable: true,
        },
        noAck: false,
        prefetchCount: 1,
        socketOptions: {
          heartbeatIntervalInSeconds: 60,
          reconnectTimeInSeconds: 10,
        },
      },
    },
  );
  await app.listen();
  console.log('🎯 RabbitMQ Consumer is listening for earthquake events...');
}
bootstrap();
