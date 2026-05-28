import { Module } from "@nestjs/common";
import { QuestionController } from "./controllers/question.controller";
import { QuestionRepository } from "./repositories/question.repository";
import { QuestionService } from "./services/question.service";
import { MongooseModule } from "@nestjs/mongoose";
import { QuestionDestination } from "@common/schemas/user-access/question.schema";

@Module({
    controllers: [QuestionController],
    providers: [QuestionRepository, QuestionService],
    imports: [MongooseModule.forFeature([QuestionDestination])],
    exports: [QuestionService]
})
export class QuestionModule { }
