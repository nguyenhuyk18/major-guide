import { ApiProperty } from '@nestjs/swagger';

export class ChatAiResponseDto {
  @ApiProperty({ example: 'Xin chào! Tôi có thể giúp gì cho bạn?' })
  message: string;

  @ApiProperty({ required: false, example: 'email@example.com' })
  email1?: string;

  @ApiProperty({ required: false, example: 'Nội dung email' })
  emailContent?: string;

  @ApiProperty({ required: false, example: [] })
  experts?: any[];

  @ApiProperty({ required: false, example: 'answer' })
  type?: 'answer' | 'action_proposal' | 'refusal';

  @ApiProperty({ required: false, example: [] })
  actions?: any[];
}

export class ChatAiRagResponseDto {
  @ApiProperty({ example: 'Câu trả lời từ AI dựa trên context...' })
  answer: string;

  @ApiProperty({ example: [] }) sources: Array<{
    id: string;
    title: string;
    score: number;
    minimum_education?: string;
  }>;
  @ApiProperty({ example: { count: 3, confidence: 'medium' } }) retrieval: {
    count: number;
    confidence: string;
  };
  @ApiProperty({ example: 'groq' }) generation: string;
  @ApiProperty({ example: [] }) suggested_questions: string[];
  @ApiProperty({ example: 'Thông tin dùng để khám phá nghề nghiệp...' })
  disclaimer: string;
}
