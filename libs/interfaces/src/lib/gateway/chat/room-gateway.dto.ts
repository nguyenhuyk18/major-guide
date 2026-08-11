import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoomRequestDto {
    @ApiProperty({ description: 'MongoDB ID của chuyên gia' })
    @IsMongoId()
    expertId: string;

    @ApiPropertyOptional({ maxLength: 100, example: 'Tư vấn hướng nghiệp' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    nameRoom?: string;
}
