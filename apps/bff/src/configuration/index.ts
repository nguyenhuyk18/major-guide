import { BaseConfiguration } from '@common/configuration/base.config';
import { AppConfiguration } from '@common/configuration/app.config';
export class Configuration extends BaseConfiguration {
    APP_CONFIG = new AppConfiguration();
}


export const CONFIGURATION = new Configuration();
export type TConfiguration = Configuration;
CONFIGURATION.validate()
