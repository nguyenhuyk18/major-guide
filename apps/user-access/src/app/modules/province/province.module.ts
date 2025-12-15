import { Module } from "@nestjs/common";
import { ProvinceController } from "./controllers/province.controller";
import { ProvinceRepository } from "./repositories/province.repository";
import { ProvinceService } from "./services/province.service";
import { MongooseModule } from "@nestjs/mongoose";
import { ProvinceDestination } from "@common/schemas/user-access/province.schema";


@Module({
    imports: [MongooseModule.forFeature([ProvinceDestination])],
    controllers: [ProvinceController],
    providers: [ProvinceRepository, ProvinceService]
})
export class ProvinceModule {

}