import { Module } from "@nestjs/common";
import { RegisterController } from "./controllers/register.controller";
import { RegisterRepository } from "./repository/register.repository";
import { RegisterService } from "./services/register.service";
import { MongooseModule } from "@nestjs/mongoose";
import { RegisterDestination } from "@common/schemas/slot/register.schema";


@Module({
    imports: [MongooseModule.forFeature([RegisterDestination])],
    controllers: [RegisterController],
    providers: [RegisterRepository, RegisterService]
})
export class RegisterModule {

}