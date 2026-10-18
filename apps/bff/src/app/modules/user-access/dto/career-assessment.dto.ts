import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  IsBoolean,
} from 'class-validator';

export class StartCareerAssessmentDto {
  @IsOptional() @IsObject() context?: Record<string, unknown>;
}
export class AnswerCareerAssessmentDto {
  @IsString() @MaxLength(80) code: string;
  @ValidateIf((_, value) => value !== null) @IsInt() @Min(1) @Max(5) value:
    | number
    | null;
  @IsOptional() @IsInt() @Min(0) @Max(3_600_000) responseTimeMs?: number;
}
export class CareerAssessmentFeedbackDto {
  @IsIn(['helpful', 'unsure', 'not_helpful']) rating: string;
  @IsOptional() @IsArray() selectedGroups?: string[];
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
export class CompleteCareerAssessmentDto {
  @IsOptional() @IsBoolean() useAiReview?: boolean;
}
export class CareerAssessmentAcademicDto {
  @IsIn(['thi_thu', 'hoc_ba']) source: 'thi_thu' | 'hoc_ba';
  // Each subject (known code, 0..10) is validated by the user-access service.
  @IsObject() scores: Record<string, number | null>;
}
