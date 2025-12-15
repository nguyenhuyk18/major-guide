import { Module } from "@nestjs/common";
import { KeycloakModule } from "../keycloak/keycloak.module";
import { AuthorizerController } from "./controllers/authorizer.controller";
import { AuthorizerService } from "./services/authorizer.service";
import { ClientsModule } from "@nestjs/microservices";
import { TCP_SERVICE, TcpProvider } from "@common/configuration/tcp.config";

@Module({
    imports: [KeycloakModule,
        ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.USER_ACCESS_SERVICE)])],
    controllers: [AuthorizerController],
    providers: [AuthorizerService]
})
export class AuthorizerModule {

}