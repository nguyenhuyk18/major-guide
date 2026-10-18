import { Logger } from '@nestjs/common';
import { EXCHANGE_NAME, QUEUE_NAME, ROUTING_KEY_NAME } from '@common/constant/enum/queuename.constant';

/**
 * Declares the booking exchanges, queues and bindings before the services connect.
 *
 * The Nest RMQ clients only *bind* their queue to an exchange, they never create the
 * exchange, so on a fresh RabbitMQ (e.g. a new server) the first booking failed with
 * "NOT_FOUND - no exchange 'booking_exchange'". Every declaration below matches
 * rabbit.config.ts exactly, so it is idempotent on a broker that already has them.
 *
 * Flow: booking -> booking_exchange (topic)
 *   booking.command -> hold_demand_queue              (slot holds the shift)
 *   booking.delay   -> hold_delay_queue_30m_v2 --30 min TTL--> booking_exchange_cancle (fanout)
 *                        -> hold_cancle_queue (booking) + hold_cancle_booking_queue (slot)
 */
export async function ensureRabbitTopology(url = process.env['RABBITMQ_SERVER_HOST'] || 'amqp://localhost:5672', attempts = 20) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const amqp = require('amqplib');
    const logger = new Logger('RabbitTopology');
    for (let attempt = 1; attempt <= attempts; attempt++) {
        let connection: any;
        try {
            connection = await amqp.connect(url);
            const channel = await connection.createChannel();
            await channel.assertExchange(EXCHANGE_NAME.BOOKING_EXCHANGE, 'topic', { durable: true });
            await channel.assertExchange(EXCHANGE_NAME.BOOKING_EXCHANGE_CANCLE, 'fanout', { durable: true });

            await channel.assertQueue(QUEUE_NAME.HOLD_DEMAND_QUEUE, { durable: true });
            await channel.assertQueue(QUEUE_NAME.HOLD_CANCLE_QUEUE, { durable: true });
            await channel.assertQueue(QUEUE_NAME.HOLD_CANCLE_BOOKING_QUEUE, { durable: true });
            await channel.assertQueue(QUEUE_NAME.HOLD_DELAY_QUEUE, {
                durable: true,
                arguments: { 'x-message-ttl': 30 * 60 * 1000, 'x-dead-letter-exchange': EXCHANGE_NAME.BOOKING_EXCHANGE_CANCLE },
            });

            await channel.bindQueue(QUEUE_NAME.HOLD_DEMAND_QUEUE, EXCHANGE_NAME.BOOKING_EXCHANGE, ROUTING_KEY_NAME.BOOKING_COMMAND);
            await channel.bindQueue(QUEUE_NAME.HOLD_DELAY_QUEUE, EXCHANGE_NAME.BOOKING_EXCHANGE, ROUTING_KEY_NAME.BOOKING_DELAY);
            await channel.bindQueue(QUEUE_NAME.HOLD_CANCLE_QUEUE, EXCHANGE_NAME.BOOKING_EXCHANGE_CANCLE, ROUTING_KEY_NAME.BOOKING_CANCLE);
            await channel.bindQueue(QUEUE_NAME.HOLD_CANCLE_BOOKING_QUEUE, EXCHANGE_NAME.BOOKING_EXCHANGE_CANCLE, ROUTING_KEY_NAME.BOOKING_CANCLE);
            await channel.close();
            logger.log('Booking exchanges, queues and bindings are ready');
            return true;
        } catch (error: any) {
            logger.warn(`RabbitMQ topology attempt ${attempt}/${attempts} failed: ${error?.message}`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
        } finally {
            await connection?.close().catch(() => undefined);
        }
    }
    logger.error('Could not declare the RabbitMQ booking topology; booking holds may fail');
    return false;
}
