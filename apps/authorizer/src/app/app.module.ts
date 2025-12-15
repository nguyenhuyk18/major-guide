import { Module } from '@nestjs/common';
import { KeycloakModule } from './keycloak/keycloak.module';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { AuthorizerModule } from './authorizer/authorizer.module';


@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [() => CONFIGURATION]
  }), KeycloakModule, AuthorizerModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION
}
