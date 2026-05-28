import { BadRequestException, Injectable } from "@nestjs/common";
import { QuestionRepository } from '../repositories/question.repository';
import { Question } from '@common/schemas/user-access/question.schema';
import { QUESTION_GROUP, TRAIT } from '@common/schemas/user-access/question.schema';

export interface CreateQuestionDto {
    questionId: string;
    group: QUESTION_GROUP;
    text: string;
    traits?: TRAIT[];
    isActive?: boolean;
}

export interface UpdateQuestionDto {
    group?: QUESTION_GROUP;
    text?: string;
    traits?: TRAIT[];
    isActive?: boolean;
}

export interface GetQuestionsDto {
    page?: number;
    limit?: number;
    group?: QUESTION_GROUP;
    isActive?: boolean;
}

@Injectable()
export class QuestionService {
    constructor(private readonly questionRepository: QuestionRepository) { }

    async create(data: CreateQuestionDto): Promise<Question> {
        if (!data.questionId || !data.group || !data.text) {
            throw new BadRequestException('questionId, group, and text are required');
        }

        const existing = await this.questionRepository.findByQuestionId(data.questionId);
        if (existing) {
            throw new BadRequestException(`Question with ID ${data.questionId} already exists`);
        }

        return this.questionRepository.create(data);
    }

    async createMany(questions: CreateQuestionDto[]): Promise<any[]> {
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new BadRequestException('Questions array is required');
        }
        return this.questionRepository.createMany(questions);
    }

    async findAll(params: GetQuestionsDto): Promise<{ questions: Question[]; total: number; totalPage: number }> {
        const { page = 1, limit = 10, group, isActive } = params;

        const cond: any = {};
        if (group) cond.group = group;
        if (isActive !== undefined) cond.isActive = isActive;

        const skip = (page - 1) * limit;
        const [questions, total] = await Promise.all([
            this.questionRepository.findAll(cond, skip, limit),
            this.questionRepository.countDocuments(cond)
        ]);

        const totalPage = Math.ceil(total / limit);

        return { questions, total, totalPage };
    }

    async findAllGrouped(): Promise<any[]> {
        return this.questionRepository.findAllGrouped();
    }

    async findAllActive(limit?: number): Promise<Question[]> {
        return this.questionRepository.findActive(limit);
    }

    async findById(id: string): Promise<Question> {
        const question = await this.questionRepository.findById(id);
        if (!question) {
            throw new BadRequestException('Question not found');
        }
        return question;
    }

    async findByGroup(group: QUESTION_GROUP): Promise<Question[]> {
        return this.questionRepository.findByGroup(group);
    }

    async update(id: string, data: UpdateQuestionDto): Promise<Question> {
        const question = await this.questionRepository.findById(id);
        if (!question) {
            throw new BadRequestException('Question not found');
        }
        return this.questionRepository.updateById(id, data);
    }

    async delete(id: string): Promise<Question> {
        const question = await this.questionRepository.findById(id);
        if (!question) {
            throw new BadRequestException('Question not found');
        }
        return this.questionRepository.deleteById(id);
    }
}
