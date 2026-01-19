import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AppConfiguration } from '@common/configuration/app.config';
import { MailConfiguration } from '@common/configuration/mail.config';
import { BaseConfiguration } from '@common/configuration/base.config';
export class Configuration extends BaseConfiguration {
    @ValidateNested()
    @Type(() => AppConfiguration)
    APP_CONFIG = new AppConfiguration();

    @ValidateNested()
    @Type(() => MailConfiguration)
    MAIL_CONFIG = new MailConfiguration();
}

export const CONFIGURATION = new Configuration();
export type TConfiguration = Configuration;
CONFIGURATION.validate();
