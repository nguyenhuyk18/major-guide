import { Module } from "@nestjs/common";
import { RegisterController } from "./controllers/register.controller";
import { RegisterRepository } from "./repository/register.repository";
import { RegisterService } from "./services/register.service";
import { MongooseModule } from "@nestjs/mongoose";
import { RegisterDestination } from "@common/schemas/slot/register.schema";
import { ClientsModule } from "@nestjs/microservices";
import { TCP_SERVICE, TcpProvider } from "@common/configuration/tcp.config";


@Module({
    imports: [MongooseModule.forFeature([RegisterDestination]),
    ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.USER_ACCESS_SERVICE)])
    ],
    controllers: [RegisterController],
    providers: [RegisterRepository, RegisterService],
    exports: [RegisterRepository]
})
export class RegisterModule {

}