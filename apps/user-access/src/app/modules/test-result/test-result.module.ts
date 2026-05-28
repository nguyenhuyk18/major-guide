import { Module } from "@nestjs/common";
import { TestResultController } from "./controllers/test-result.controller";
import { TestResultRepository } from "./repositories/test-result.repository";
import { TestResultService } from "./services/test-result.service";
import { MongooseModule } from "@nestjs/mongoose";
import { TestResultDestination } from "@common/schemas/user-access/test-result.schema";

@Module({
    controllers: [TestResultController],
    providers: [TestResultRepository, TestResultService],
    imports: [MongooseModule.forFeature([TestResultDestination])],
    exports: [TestResultService]
})
export class TestResultModule { }
