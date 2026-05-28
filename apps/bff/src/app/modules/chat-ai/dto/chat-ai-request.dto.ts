import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatAiRequestDto {
    @ApiProperty({ example: 'Xin chào, tôi muốn hỏi về chuyên gia' })
    @IsNotEmpty()
    @IsString()
    message: string;
}
