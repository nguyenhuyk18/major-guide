import { BadRequestException, Injectable } from "@nestjs/common";
import { TestResultRepository } from '../repositories/test-result.repository';
import { TestResult, AnswerOption, TraitScore } from '@common/schemas/user-access/test-result.schema';
import { TRAIT } from '@common/schemas/user-access/question.schema';
import { v4 as uuidv4 } from 'uuid';

export interface SaveAnswerDto {
    userId: string;
    questionId: string;
    score: number;
}

export interface SubmitTestDto {
    userId: string;
    answers: AnswerOption[];
    traitScores: TraitScore[];
    totalScore: number;
}

@Injectable()
export class TestResultService {
    constructor(private readonly testResultRepository: TestResultRepository) { }

    private buildTestId(): string {
        return `TEST-${uuidv4().substring(0, 8).toUpperCase()}`;
    }

    async saveAnswer(data: SaveAnswerDto): Promise<TestResult> {
        const { userId, questionId, score } = data;

        if (score < 1 || score > 5) {
            throw new BadRequestException('Score must be between 1 and 5');
        }

        let result = await this.testResultRepository.findByTestId(
            `${userId}_inprogress`
        );

        if (!result) {
            result = await this.testResultRepository.create({
                testId: `${userId}_inprogress`,
                userId,
                answers: [],
                isCompleted: false
            });
        }

        const existingAnswers = result.answers.filter(a => a.questionId !== questionId);
        existingAnswers.push({ questionId, score });

        return this.testResultRepository.updateById(result._id.toString(), {
            answers: existingAnswers
        });
    }

    async submitTest(data: SubmitTestDto): Promise<TestResult> {
        const { userId, answers, traitScores, totalScore } = data;

        let result = await this.testResultRepository.findByTestId(
            `${userId}_inprogress`
        );

        const testId = this.buildTestId();

        if (result) {
            await this.testResultRepository.deleteById(result._id.toString());
        }

        return this.testResultRepository.create({
            testId,
            userId,
            answers,
            traitScores,
            totalScore,
            isCompleted: true,
            completedAt: new Date()
        });
    }

    async getResultsByUser(userId: string): Promise<TestResult[]> {
        return this.testResultRepository.findByUserId(userId);
    }

    async getLatestResult(userId: string): Promise<TestResult | null> {
        return this.testResultRepository.findLatestByUserId(userId);
    }

    async getInProgressTest(userId: string): Promise<TestResult | null> {
        return this.testResultRepository.findByTestId(`${userId}_inprogress`);
    }

    async getAllResults(
        page: number = 1,
        limit: number = 10
    ): Promise<{ results: TestResult[]; total: number; totalPage: number }> {
        const skip = (page - 1) * limit;
        const [results, total] = await Promise.all([
            this.testResultRepository.findAll({}, skip, limit),
            this.testResultRepository.countDocuments({ isCompleted: true })
        ]);

        return {
            results,
            total,
            totalPage: Math.ceil(total / limit)
        };
    }

    async getResultById(id: string): Promise<TestResult> {
        const result = await this.testResultRepository.findById(id);
        if (!result) {
            throw new BadRequestException('Test result not found');
        }
        return result;
    }

    async deleteResult(id: string): Promise<TestResult> {
        const result = await this.testResultRepository.findById(id);
        if (!result) {
            throw new BadRequestException('Test result not found');
        }
        return this.testResultRepository.deleteById(id);
    }
}
