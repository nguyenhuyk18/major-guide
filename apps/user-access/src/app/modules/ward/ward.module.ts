import { Module } from "@nestjs/common";
import { WardController } from "./controllers/ward.controller";
import { WardService } from "./services/ward.service";
import { WardRepository } from "./repositories/ward.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { WardDestination } from "@common/schemas/user-access/ward.schema";

@Module({
    imports: [MongooseModule.forFeature([WardDestination])],
    controllers: [WardController],
    providers: [WardService, WardRepository]
})
export class WardModule {

}