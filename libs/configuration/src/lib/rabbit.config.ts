import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsProviderAsyncOptions, RmqOptions, Transport } from '@nestjs/microservices'
import { IsNotEmpty, IsObject } from 'class-validator';
import { EXCHANGE_NAME, QUEUE_NAME, ROUTING_KEY_NAME } from '@common/constant/enum/queuename.constant';

// url

export enum RABBIT_SERVICE {

    MAIL_SERVICE = 'RABBIT_MAIL_SERVICE',
    BOOKING_HOLD_DELAY = 'BOOKING_HOLD_DELAY',
    BOOKING_HOLD_CANCEL = 'BOOKING_HOLD_CANCEL',
    BOOKING_HOLD_CANCEL_SLOT = 'BOOKING_HOLD_CANCEL_SLOT',
    BOOKING_HOLD_DEMAND = 'BOOKING_HOLD_DEMAND',
    // BOOKING_
}


export class RabbitConfiguration {
    // các thuộc tính đại diện cho 1 queue của nó
    @IsNotEmpty()
    @IsObject()
    RABBIT_MAIL_SERVICE: RmqOptions;

    @IsNotEmpty()
    @IsObject()
    BOOKING_HOLD_DELAY: RmqOptions;

    @IsNotEmpty()
    @IsObject()
    BOOKING_HOLD_CANCEL: RmqOptions;

    @IsNotEmpty()
    @IsObject()
    BOOKING_HOLD_DEMAND: RmqOptions;

    @IsNotEmpty()
    @IsObject()
    BOOKING_HOLD_CANCEL_SLOT: RmqOptions;

    constructor() {
        this.RABBIT_MAIL_SERVICE = RabbitConfiguration.setValue(
            [process.env['RABBITMQ_SERVER_HOST'] || 'amqp://localhost:5672'], QUEUE_NAME.SEND_MAIL_QUEUE
        );

        // queue này để cập nhật cái trạng thái bên service slot
        this.BOOKING_HOLD_CANCEL = RabbitConfiguration.basicQueue(
            {
                urls: [process.env['RABBITMQ_SERVER_HOST'] || 'amqp://localhost:5672'],
                queue: QUEUE_NAME.HOLD_CANCLE_QUEUE,
                exchange: EXCHANGE_NAME.BOOKING_EXCHANGE_CANCLE,
                routingKey: ROUTING_KEY_NAME.BOOKING_CANCLE
            }
        )

        // queue này để cập nhật cái trạng thái tại service booking 
        this.BOOKING_HOLD_CANCEL_SLOT = RabbitConfiguration.basicQueue({
            urls: [process.env['RABBITMQ_SERVER_HOST'] || 'amqp://localhost:5672'],
            queue: QUEUE_NAME.HOLD_CANCLE_BOOKING_QUEUE,
            exchange: EXCHANGE_NAME.BOOKING_EXCHANGE_CANCLE,
            routingKey: ROUTING_KEY_NAME.BOOKING_CANCLE
        })


        this.BOOKING_HOLD_DELAY = RabbitConfiguration.delayQueue(
            {
                urls: [process.env['RABBITMQ_SERVER_HOST'] || 'amqp://localhost:5672'],
                queue: QUEUE_NAME.HOLD_DELAY_QUEUE,
                exchange: EXCHANGE_NAME.BOOKING_EXCHANGE,
                routingKey: ROUTING_KEY_NAME.BOOKING_DELAY,
                deadLetterRoutingKey: EXCHANGE_NAME.BOOKING_EXCHANGE_CANCLE,
                ttl: 1 * 60 * 1000,
            }
        )

        this.BOOKING_HOLD_DEMAND = RabbitConfiguration.basicQueue(
            {
                urls: [process.env['RABBITMQ_SERVER_HOST'] || 'amqp://localhost:5672'],
                queue: QUEUE_NAME.HOLD_DEMAND_QUEUE,
                exchange: EXCHANGE_NAME.BOOKING_EXCHANGE,
                routingKey: ROUTING_KEY_NAME.BOOKING_COMMAND
            }
        )
    }


    private static setValue(urls: string[], queueName: string): RmqOptions {
        return {
            transport: Transport.RMQ,
            options: {

                urls: urls,
                queue: queueName,
                queueOptions: {
                    durable: true,
                },
                prefetchCount: 10,
                noAck: true,
                persistent: true
            }
        }
    }

    private static basicQueue(params: {
        urls: string[];
        exchange?: string;
        queue: string;
        routingKey?: string;
    }): RmqOptions {
        return {
            transport: Transport.RMQ,
            options: {
                urls: params.urls,
                exchange: params.exchange,
                routingKey: params.routingKey,
                queue: params.queue,
                queueOptions: {
                    durable: true,
                },
                prefetchCount: 10,
                noAck: true, // giữ nguyên style cũ
            },
        };
    }

    private static delayQueue(params: {
        urls: string[];
        exchange: string;
        queue: string;
        routingKey: string;
        ttl: number;
        deadLetterRoutingKey: string;
    }): RmqOptions {
        return {
            transport: Transport.RMQ,
            options: {
                urls: params.urls,
                exchange: params.exchange,
                routingKey: params.routingKey,
                queue: params.queue,
                queueOptions: {
                    durable: true,
                    arguments: {
                        'x-message-ttl': params.ttl,
                        'x-dead-letter-exchange': params.deadLetterRoutingKey,
                        // thông số này nghĩa là sau 5p nó sẽ chuyển queue
                        // 'x-dead-letter-routing-key': params.deadLetterRoutingKey,
                    },
                },
                prefetchCount: 10,
                noAck: true, // cái mới thì nên ack
            },
        };
    }
}

export function RabbitProvider(serviceName: keyof RabbitConfiguration): ClientsProviderAsyncOptions {
    return {
        name: serviceName,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
            return configService.get(`RABBIT_CONFIG.${serviceName}`) as RmqOptions;
        }
    }
}


