import { Module } from "@nestjs/common";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { AvartarController } from "./controllers/avartar.controller";

@Module({
    imports: [CloudinaryModule],
    controllers: [AvartarController]
})
export class AvartarModule {

}