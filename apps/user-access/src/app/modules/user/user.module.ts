import { Module } from "@nestjs/common";
import { UserController } from "./controllers/user.controller";
import { UserRepository } from "./repositories/user.repository";
import { UserService } from "./services/user.service";
import { MongooseModule } from "@nestjs/mongoose";
import { UserDestination } from "@common/schemas/user-access/user.schema";
import { ClientsModule } from "@nestjs/microservices";
import { TCP_SERVICE, TcpProvider } from "@common/configuration/tcp.config";

@Module({
    controllers: [UserController],
    providers: [UserRepository, UserService],
    imports: [MongooseModule.forFeature([UserDestination]),
    ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.MEDIA_SERVICE)])
    ]
})
export class UserModule {

}