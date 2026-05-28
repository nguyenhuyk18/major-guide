import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TestResult, TestResultModel, TestResultModelName } from '@common/schemas/user-access/test-result.schema';
import { Filter } from "mongodb";

@Injectable()
export class TestResultRepository {
    constructor(@InjectModel(TestResultModelName) private readonly testResultModel: TestResultModel) { }

    create(data: Partial<TestResult>) {
        return this.testResultModel.create(data);
    }

    findAll(cond: Filter<TestResult> = {}, skip?: number, limit?: number) {
        let query = this.testResultModel.find(cond);
        if (skip !== undefined) query = query.skip(skip);
        if (limit !== undefined) query = query.limit(limit);
        return query.sort({ completedAt: -1 }).lean().exec();
    }

    countDocuments(cond: Filter<TestResult> = {}) {
        return this.testResultModel.countDocuments(cond).exec();
    }

    findById(id: string) {
        return this.testResultModel.findById(id).lean().exec();
    }

    findByUserId(userId: string) {
        return this.testResultModel.find({ userId }).sort({ completedAt: -1 }).lean().exec();
    }

    findLatestByUserId(userId: string) {
        return this.testResultModel.findOne({ userId, isCompleted: true })
            .sort({ completedAt: -1 })
            .lean()
            .exec();
    }

    findByTestId(testId: string) {
        return this.testResultModel.findOne({ testId }).lean().exec();
    }

    updateById(id: string, data: Partial<TestResult>) {
        return this.testResultModel.findByIdAndUpdate(id, data, { new: true }).lean().exec();
    }

    updateByUserId(userId: string, data: Partial<TestResult>) {
        return this.testResultModel.findOneAndUpdate(
            { userId, isCompleted: false },
            data,
            { new: true }
        ).lean().exec();
    }

    deleteById(id: string) {
        return this.testResultModel.findByIdAndDelete(id).lean().exec();
    }

    deleteByUserId(userId: string) {
        return this.testResultModel.deleteMany({ userId }).lean().exec();
    }
}
