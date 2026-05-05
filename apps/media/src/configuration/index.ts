import { BaseConfiguration } from '@common/configuration/base.config';
import { AppConfiguration } from '@common/configuration/app.config';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'
import { TcpConfiguration } from '@common/configuration/tcp.config';
import { CloudinaryConfiguration } from '@common/configuration/cloudinary.config';
import { MongoConfiguration } from '@common/configuration/mongo.config';

export class Configuration extends BaseConfiguration {

    @ValidateNested()
    @Type(() => AppConfiguration)
    APP_CONFIG = new AppConfiguration();


    @ValidateNested()
    @Type(() => CloudinaryConfiguration)
    CLOUD_SERV = new CloudinaryConfiguration()


    @ValidateNested()
    @Type(() => TcpConfiguration)
    TCP_SERV = new TcpConfiguration()

    @ValidateNested()
    @Type(() => MongoConfiguration)
    MONGO_CONFIG = new MongoConfiguration({ DB_NAME: process.env['MEDIA_SERVICE_DB_NAME'] || 'media' })

}


export const CONFIGURATION = new Configuration();
export type TConfiguration = Configuration;
CONFIGURATION.validate()
