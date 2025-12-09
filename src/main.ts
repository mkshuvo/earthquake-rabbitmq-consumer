import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { rabbitmqConfig } from './rabbitmq/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: rabbitmqConfig.options,
  });

  await app.startAllMicroservices();
  const port = process.env.PORT || 7000;
  await app.listen(port);
  console.log(`🎯 RabbitMQ Consumer is listening for earthquake events and HTTP on port ${port}...`);
}
bootstrap();
