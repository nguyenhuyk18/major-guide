import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateExpertReviewDto {
    @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ maxLength: 1000, example: 'Chuyên gia tư vấn rất tận tâm.' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    comment?: string;
}

export class UpdateExpertReviewDto extends CreateExpertReviewDto { }

export interface ReviewSummary {
    averageRating: number;
    totalReviews: number;
}

export interface ExpertReviewResponse {
    id: string;
    expertId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
    reviewer: {
        id: string;
        name?: string;
        avatar?: string;
    };
}

export interface ExpertReviewListResponse extends ReviewSummary {
    reviews: ExpertReviewResponse[];
    page: number;
    limit: number;
    totalPages: number;
}
