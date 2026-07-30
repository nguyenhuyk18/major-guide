import { TCP_SERVICE, TcpProvider } from "@common/configuration/tcp.config";
import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import { ProvinceController } from "./controllers/province.controller";
import { WardController } from "./controllers/ward.controller";
import { UserController } from "./controllers/user.controller";
import { QuestionController } from "./controllers/question.controller";
import { TestResultController } from "./controllers/test-result.controller";
import { ReviewController } from "./controllers/review.controller";

@Module({
    imports: [ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.USER_ACCESS_SERVICE)])],
    controllers: [ProvinceController, WardController, UserController, QuestionController, TestResultController, ReviewController]
})
export class UserAccessModule {

}
