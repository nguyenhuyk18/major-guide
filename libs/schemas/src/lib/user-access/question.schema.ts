import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';

export enum QUESTION_GROUP {
    LOGIC_ANALYSIS = 'A. Logic & phân tích',
    TECHNOLOGY_SYSTEMS = 'B. Công nghệ & hệ thống',
    DATA_AI = 'C. Dữ liệu & AI thinking',
    SECURITY_INVESTIGATION = 'D. Bảo mật & điều tra',
    CREATIVE_DESIGN = 'E. Sáng tạo & thiết kế',
    COMMUNICATION_INFLUENCE = 'F. Giao tiếp & ảnh hưởng',
    HELPING_PEOPLE = 'G. Giúp đỡ con người',
    PRACTICAL_TECHNICAL = 'H. Kỹ thuật thực hành',
    MANAGEMENT_ORGANIZATION = 'I. Quản lý & tổ chức'
}

export enum TRAIT {
    LOGICAL = 'logical',
    ANALYTICAL = 'analytical',
    DISCIPLINE = 'discipline',
    TECHNICAL = 'technical',
    CURIOSITY = 'curiosity',
    CREATIVE = 'creative',
    SYSTEMATIC = 'systematic',
    RESEARCH_MINDSET = 'research_mindset',
    DETAIL_ORIENTED = 'detail_oriented',
    ARTISTIC = 'artistic',
    ADAPTABILITY = 'adaptability',
    COMMUNICATION = 'communication',
    LEADERSHIP = 'leadership',
    PERSUASION = 'persuasion',
    EMPATHY = 'empathy'
}

@Schema({ collection: 'question', timestamps: true })
export class Question extends Base {
    @Prop({ type: String, required: true })
    questionId: string;

    @Prop({ type: String, enum: QUESTION_GROUP, required: true })
    group: QUESTION_GROUP;

    @Prop({ type: String, required: true })
    text: string;

    @Prop({ type: [String], enum: TRAIT, default: [] })
    traits: TRAIT[];

    @Prop({ type: Boolean, default: true })
    isActive: boolean;
}

export const QuestionSchema = createSchema(Question)

export const QuestionModelName = Question.name

export const QuestionDestination = {
    name: QuestionModelName,
    schema: QuestionSchema
}

export type QuestionModel = Model<Question>;
