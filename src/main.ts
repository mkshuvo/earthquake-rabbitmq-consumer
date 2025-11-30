import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { rabbitmqConfig } from './rabbitmq/rabbitmq.config';

async function bootstrap() {
  // Log the RabbitMQ configuration being used
  console.log('🔌 Starting RabbitMQ Consumer...');
  console.log(`📝 Configured RabbitMQ URLs: ${JSON.stringify(rabbitmqConfig.options.urls)}`);
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: rabbitmqConfig.options,
    },
  );
  await app.listen();
  console.log('🎯 RabbitMQ Consumer is listening for earthquake events...');
}
bootstrap();
