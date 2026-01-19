import { ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsNotEmpty, IsString } from 'class-validator';
export class ChatComunityRequestDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    content: string

    // @ApiProperty()
    // @IsNotEmpty()
    // @IsString()
    // sendBy: string;

    @ApiProperty()
    @IsString()
    replyTo?: string;
}