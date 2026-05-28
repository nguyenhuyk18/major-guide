import { BaseConfiguration } from '@common/configuration/base.config';
import { AppConfiguration } from '@common/configuration/app.config';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'
import { MongoConfiguration } from '@common/configuration/mongo.config';
import { TcpConfiguration } from '@common/configuration/tcp.config';
import { GrpcConfiguration } from '@common/configuration/grpc.config';
import { RabbitConfiguration } from '@common/configuration/rabbit.config';
import { QUEUE_NAME } from '@common/constant/enum/queuename.constant';
import { RedisConfiguration } from '@common/configuration/redis.config';

export class Configuration extends BaseConfiguration {

    @ValidateNested()
    @Type(() => AppConfiguration)
    APP_CONFIG = new AppConfiguration();

    @ValidateNested()
    @Type(() => MongoConfiguration)
    MONGO_CONFIG = new MongoConfiguration({ DB_NAME: process.env['USER_ACCESS_SERVICE_DB_NAME'] })

    @ValidateNested()
    @Type(() => TcpConfiguration)
    TCP_SERV = new TcpConfiguration()


    @ValidateNested()
    @Type(() => RedisConfiguration)
    REDIS_CONFIG = new RedisConfiguration()


    @ValidateNested()
    @Type(() => GrpcConfiguration)
    GRPC_CONFIG = new GrpcConfiguration()

    @ValidateNested()
    @Type(() => RabbitConfiguration)
    RABBIT_CONFIG = new RabbitConfiguration();
}


export const CONFIGURATION = new Configuration();
export type TConfiguration = Configuration;
CONFIGURATION.validate()
