import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Question, QuestionModel, QuestionModelName } from '@common/schemas/user-access/question.schema';
import { QUESTION_GROUP } from '@common/schemas/user-access/question.schema';
import { Filter } from "mongodb";

@Injectable()
export class QuestionRepository {
    constructor(@InjectModel(QuestionModelName) private readonly questionModel: QuestionModel) { }

    create(data: Partial<Question>) {
        return this.questionModel.create(data);
    }

    createMany(data: Partial<Question>[]) {
        return this.questionModel.insertMany(data);
    }

    findAll(cond: Filter<Question> = {}, skip?: number, limit?: number) {
        let query = this.questionModel.find(cond);
        if (skip !== undefined) query = query.skip(skip);
        if (limit !== undefined) query = query.limit(limit);
        return query.lean().exec();
    }

    findAllGrouped() {
        return this.questionModel.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$group',
                    questions: {
                        $push: {
                            _id: '$_id',
                            questionId: '$questionId',
                            text: '$text',
                            traits: '$traits'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).exec();
    }

    countDocuments(cond: Filter<Question> = {}) {
        return this.questionModel.countDocuments(cond).exec();
    }

    findById(id: string) {
        return this.questionModel.findById(id).lean().exec();
    }

    findByQuestionId(questionId: string) {
        return this.questionModel.findOne({ questionId }).lean().exec();
    }

    findByGroup(group: QUESTION_GROUP) {
        return this.questionModel.find({ group, isActive: true }).lean().exec();
    }

    findActive(limit?: number) {
        let query = this.questionModel.find({ isActive: true });
        if (limit) query = query.limit(limit);
        return query.sort({ questionId: 1 }).lean().exec();
    }

    updateById(id: string, data: Partial<Question>) {
        return this.questionModel.findByIdAndUpdate(id, data, { new: true }).lean().exec();
    }

    deleteById(id: string) {
        return this.questionModel.findByIdAndDelete(id).lean().exec();
    }
}
