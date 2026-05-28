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
}

export class ChatAiRagResponseDto {
    @ApiProperty({ example: 'Câu trả lời từ AI dựa trên context...' })
    answer: string;

    @ApiProperty({ example: 'Nội dung context từ Qdrant...' })
    context_used: string;

    @ApiProperty({ example: 5 })
    results_count: number;

    @ApiProperty({ example: 'Câu hỏi gốc của user' })
    query: string;
}
