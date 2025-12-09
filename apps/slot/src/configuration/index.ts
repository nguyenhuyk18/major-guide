import { BaseConfiguration } from '@common/configuration/base.config';
import { AppConfiguration } from '@common/configuration/app.config';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'
import { MongoConfiguration } from '@common/configuration/mongo.config';
import { TcpConfiguration } from '@common/configuration/tcp.config';

export class Configuration extends BaseConfiguration {

    @ValidateNested()
    @Type(() => AppConfiguration)
    APP_CONFIG = new AppConfiguration();

    @ValidateNested()
    @Type(() => MongoConfiguration)
    MONGO_CONFIG = new MongoConfiguration({ DB_NAME: process.env['SLOT_SERVICE_DB_NAME'] })

    @ValidateNested()
    @Type(() => TcpConfiguration)
    TCP_SERV = new TcpConfiguration()

}


export const CONFIGURATION = new Configuration();
export type TConfiguration = Configuration;
CONFIGURATION.validate()
