import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PostDestination } from "@common/schemas/media/post.schema";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { PostController } from "./controllers/post.controller";
import { PostService } from "./services/post.service";
import { PostRepository } from "./repositories/post.repository";

@Module({
    imports: [
        MongooseModule.forFeature([PostDestination]),
        CloudinaryModule
    ],
    controllers: [PostController],
    providers: [PostService, PostRepository],
    exports: [PostService]
})
export class PostModule { }
