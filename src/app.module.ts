import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [RabbitmqModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}