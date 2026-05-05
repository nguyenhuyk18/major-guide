import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { TcpProvider, TCP_SERVICE } from "@common/configuration/tcp.config";
import { PostController } from "./controllers/post.controller";

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage()
        }),
        ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.MEDIA_SERVICE)])
    ],
    controllers: [PostController]
})
export class PostModule { }
