import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsArray, IsNumber, Min, Max } from "class-validator";
import { TRAIT } from "@common/schemas/user-access/question.schema";

export class AnswerOptionRequestDto {
    @ApiProperty({ description: 'ID câu hỏi (VD: q1, q2)', example: 'q1' })
    @IsNotEmpty()
    @IsString()
    questionId: string;

    @ApiProperty({ description: 'Điểm số từ 1-5', example: 4, minimum: 1, maximum: 5 })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(5)
    score: number;
}

export class TraitScoreRequestDto {
    @ApiProperty({ description: 'Tên trait (VD: logical, analytical)', enum: TRAIT, example: 'logical' })
    @IsNotEmpty()
    @IsEnum(TRAIT)
    trait: TRAIT;

    @ApiProperty({ description: 'Tổng điểm của trait', example: 15 })
    @IsNotEmpty()
    @IsNumber()
    score: number;

    @ApiProperty({ description: 'Số câu hỏi có trait này', example: 5 })
    @IsNotEmpty()
    @IsNumber()
    count: number;
}

export class SaveAnswerRequestDto {
    @ApiProperty({ description: 'ID người dùng', example: 'user123' })
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiProperty({ description: 'ID câu hỏi đang trả lời', example: 'q1' })
    @IsNotEmpty()
    @IsString()
    questionId: string;

    @ApiProperty({ description: 'Điểm số (1-5)', example: 4, minimum: 1, maximum: 5 })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(5)
    score: number;
}

export class SubmitTestRequestDto {
    @ApiProperty({ description: 'ID người dùng', example: 'user123' })
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiProperty({ description: 'Danh sách đáp án đã chọn', type: [AnswerOptionRequestDto] })
    @IsNotEmpty()
    @IsArray()
    answers: AnswerOptionRequestDto[];

    @ApiProperty({ description: 'Điểm số theo từng trait', type: [TraitScoreRequestDto] })
    @IsNotEmpty()
    @IsArray()
    traitScores: TraitScoreRequestDto[];

    @ApiProperty({ description: 'Tổng điểm tất cả các câu', example: 156 })
    @IsNotEmpty()
    @IsNumber()
    totalScore: number;
}
