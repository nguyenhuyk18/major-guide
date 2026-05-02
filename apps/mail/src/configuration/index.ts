import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AppConfiguration } from '@common/configuration/app.config';
import { MailConfiguration } from '@common/configuration/mail.config';
import { BaseConfiguration } from '@common/configuration/base.config';
import { RabbitConfiguration } from '@common/configuration/rabbit.config';
import { TcpConfiguration } from '@common/configuration/tcp.config';
// import { QUEUE_NAME } from '@common/constant/enum/queuename.constant';
export class Configuration extends BaseConfiguration {
    @ValidateNested()
    @Type(() => AppConfiguration)
    APP_CONFIG = new AppConfiguration();

    @ValidateNested()
    @Type(() => MailConfiguration)
    MAIL_CONFIG = new MailConfiguration();


    @ValidateNested()
    @Type(() => RabbitConfiguration)
    RABBIT_CONFIG = new RabbitConfiguration();

    @ValidateNested()
    @Type(() => TcpConfiguration)
    TCP_SERV = new TcpConfiguration();

}

export const CONFIGURATION = new Configuration();
export type TConfiguration = Configuration;
CONFIGURATION.validate();
