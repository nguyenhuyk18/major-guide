import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatAiRequestDto {
  @ApiProperty({ example: 'Xin chào, tôi muốn hỏi về chuyên gia' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ChatAiHistoryTurnDto)
  history?: ChatAiHistoryTurnDto[];
}

export class ChatAiHistoryTurnDto {
  @IsIn(['user', 'assistant']) role: 'user' | 'assistant';
  @IsString() @IsNotEmpty() @MaxLength(1500) content: string;
}

export class ChatAiMemberRequestDto {
  @IsString() @IsNotEmpty() @MaxLength(1500) message: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ChatAiHistoryTurnDto)
  history?: ChatAiHistoryTurnDto[];
}

export class ChatAiRagRequestDto {
  @IsString() @IsNotEmpty() @MaxLength(1500) message: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ChatAiHistoryTurnDto)
  history?: ChatAiHistoryTurnDto[];
}
