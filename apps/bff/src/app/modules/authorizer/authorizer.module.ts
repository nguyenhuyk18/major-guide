import { Module } from "@nestjs/common";
import { AuthorizerController } from "./controllers/authorizer.controller";
import { ClientsModule } from "@nestjs/microservices";
import { TCP_SERVICE, TcpProvider } from "@common/configuration/tcp.config";

@Module({
    imports: [ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.AUTHORIZER_SERVICE)])],
    controllers: [AuthorizerController]
})
export class AuthorizerModule {

}