import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsArray, IsBoolean, IsNumber, Min, Max } from "class-validator";
import { QUESTION_GROUP, TRAIT } from "@common/schemas/user-access/question.schema";

export class CreateQuestionRequestDto {
    @ApiProperty({ description: 'ID câu hỏi (VD: q1, q2)', example: 'q1' })
    @IsNotEmpty()
    @IsString()
    questionId: string;

    @ApiProperty({ description: 'Nhóm câu hỏi (A-I)', enum: QUESTION_GROUP, example: 'A. Logic & phân tích' })
    @IsNotEmpty()
    @IsEnum(QUESTION_GROUP)
    group: QUESTION_GROUP;

    @ApiProperty({ description: 'Nội dung câu hỏi', example: 'Tôi thích tìm nguyên nhân gốc rễ của một vấn đề.' })
    @IsNotEmpty()
    @IsString()
    text: string;

    @ApiProperty({ description: 'Danh sách traits (VD: logical, analytical)', enum: TRAIT, isArray: true, example: ['logical', 'analytical'], required: false })
    @IsOptional()
    @IsArray()
    traits?: TRAIT[];

    @ApiProperty({ description: 'Câu hỏi có đang active không', example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class CreateManyQuestionsRequestDto {
    @ApiProperty({ description: 'Danh sách câu hỏi cần tạo', type: [CreateQuestionRequestDto] })
    @IsNotEmpty()
    @IsArray()
    questions: CreateQuestionRequestDto[];
}

export class UpdateQuestionRequestDto {
    @ApiProperty({ description: 'Nhóm câu hỏi mới (A-I)', enum: QUESTION_GROUP, required: false })
    @IsOptional()
    @IsEnum(QUESTION_GROUP)
    group?: QUESTION_GROUP;

    @ApiProperty({ description: 'Nội dung câu hỏi mới', example: 'Nội dung câu hỏi đã cập nhật', required: false })
    @IsOptional()
    @IsString()
    text?: string;

    @ApiProperty({ description: 'Danh sách traits mới', enum: TRAIT, isArray: true, required: false })
    @IsOptional()
    @IsArray()
    traits?: TRAIT[];

    @ApiProperty({ description: 'Trạng thái active', example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
