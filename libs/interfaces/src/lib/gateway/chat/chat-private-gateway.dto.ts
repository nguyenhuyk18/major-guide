import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class SendPrivateMessageRequestDto {
    @ApiProperty({ description: 'MongoDB ID của room' })
    @IsMongoId()
    roomId: string;

    @ApiProperty({ maxLength: 2000, example: 'Xin chào chuyên gia' })
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    content: string;
}
