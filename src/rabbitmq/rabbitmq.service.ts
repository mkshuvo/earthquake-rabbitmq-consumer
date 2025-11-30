import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  Transport,
} from '@nestjs/microservices';
import * as retry from 'retry';
import { rabbitmqConfig } from './rabbitmq.config';
import {
  EarthquakeEvent,
  EarthquakeNotification,
} from 'src/earthquake/earthquake.interface';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class RabbitmqService implements OnModuleInit {
  private readonly logger = new Logger(RabbitmqService.name);
  private client: ClientProxy;

  constructor(private readonly notificationService: NotificationService) {}

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
          transport: Transport.RMQ,
          options: rabbitmqConfig.options,
        });
        this.logger.log('Connected to RabbitMQ successfully');
      } catch (error) {
        this.logger.error(
          `Error connecting to RabbitMQ (attempt ${currentAttempt}):`,
          error,
        );
        if (operation.retry(error)) {
          return;
        }
        this.logger.error('Max retries reached. Exiting...');
        process.exit(1);
      }
    });
  }

  async processEarthquakeEvent(
    earthquake: EarthquakeEvent,
    context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(`Processing earthquake event: ${earthquake.id}`);

      // Process earthquake based on magnitude
      await this.processEarthquakeAlert(earthquake);

      // Acknowledge the message
      channel.ack(originalMsg);
      this.logger.log(`Successfully processed earthquake ${earthquake.id}`);
    } catch (error) {
      this.logger.error(`Error processing earthquake ${earthquake.id}:`, error);

      // Reject and requeue the message for retry
      channel.nack(originalMsg, false, true);
    }
  }

  private async processEarthquakeAlert(earthquake: EarthquakeEvent) {
    const magnitude = earthquake.magnitude;

    // Determine alert priority based on magnitude
    const alertPriority =
      this.notificationService.getDetermineAlertPriority(magnitude);

    this.logger.log(
      `Earthquake alert - Magnitude: ${magnitude}, Priority: ${alertPriority}`,
    );

    // Only send notifications if priority threshold is met
    if (
      this.notificationService.shouldSendNotification(earthquake, alertPriority)
    ) {
      await this.sendNotifications(earthquake, alertPriority);
    } else {
      this.logger.log(
        `Skipping notification for low priority earthquake: M${magnitude}`,
      );
    }
  }

  private async sendNotifications(
    earthquake: EarthquakeEvent,
    priority: 'low' | 'medium' | 'high' | 'critical',
  ) {
    try {
      // Create notification payload
      const notification: EarthquakeNotification = {
        title: `🌍 Earthquake Alert - M${earthquake.magnitude}`,
        body: `${earthquake.location.place} - Depth: ${earthquake.depth}km`,
        data: {
          earthquakeId: earthquake.id,
          magnitude: earthquake.magnitude,
          location: earthquake.location,
          timestamp: earthquake.timestamp,
          priority: priority,
        },
      };

      // Send push notifications to mobile devices
      await this.notificationService.sendPushNotification(notification);

      // Send WebSocket notifications to web clients
      await this.notificationService.sendWebSocketNotification(notification);

      // Send email alerts for critical earthquakes
      await this.notificationService.sendEmailAlert(earthquake);

      this.logger.log(
        `All notifications sent successfully for earthquake ${earthquake.id}`,
      );
    } catch (error) {
      this.logger.error('Error sending notifications:', error);
      throw error;
    }
  }

  @MessagePattern('health.check')
  handleHealthCheck(@Payload() data: any) {
    try {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'earthquake-rabbitmq-consumer',
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      throw error;
    }
  }
}
