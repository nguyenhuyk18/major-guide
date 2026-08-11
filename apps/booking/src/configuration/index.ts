import { BaseConfiguration } from '@common/configuration/base.config';
import { AppConfiguration } from '@common/configuration/app.config';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'
import { TcpConfiguration } from '@common/configuration/tcp.config';
import { MongoConfiguration } from '@common/configuration/mongo.config';
import { RabbitConfiguration } from '@common/configuration/rabbit.config';
import { StripeConfiguration } from '@common/configuration/stripe.config';
import { GoogleCalendarConfiguration } from '@common/configuration/google-calendar.config';

export class Configuration extends BaseConfiguration {
    @ValidateNested()
    @Type(() => AppConfiguration)
    APP_CONFIG = new AppConfiguration();

    @ValidateNested()
    @Type(() => TcpConfiguration)
    TCP_SERV = new TcpConfiguration()

    @ValidateNested()
    @Type(() => MongoConfiguration)
    MONGO_CONFIG = new MongoConfiguration({ DB_NAME: process.env['BOOKING_SERVICE_DB_NAME'] })



    @ValidateNested()
    @Type(() => RabbitConfiguration)
    RABBIT_CONFIG = new RabbitConfiguration();

    @ValidateNested()
    @Type(() => StripeConfiguration)
    STRIPE_CONFIG = new StripeConfiguration();


    @ValidateNested()
    @Type(() => GoogleCalendarConfiguration)
    GOOGLE_CALENDAR_CONFIG = new GoogleCalendarConfiguration();
}

export const CONFIGURATION = new Configuration();
export type TConfiguration = Configuration;

CONFIGURATION.validate()
