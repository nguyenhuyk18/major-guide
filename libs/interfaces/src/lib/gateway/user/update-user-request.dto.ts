import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, IsEnum, ValidateNested, IsArray, ArrayMaxSize, IsIn } from "class-validator";
import { Type } from "class-transformer";
import { LEVEL_USER } from "@common/constant/enum/level-user.constant";
import { CAREER_FAMILY_CODES, MAX_EXPERT_CAREER_FAMILIES } from "@common/constant/enum/career-family.constant";

export class UpdateExpertInfoDto {
    @ApiProperty({ required: false, description: 'Nơi giảng dạy' })
    @IsOptional()
    @IsString()
    teachAt?: string;

    @ApiProperty({ required: false, description: 'Thông tin giới thiệu' })
    @IsOptional()
    @IsString()
    information?: string;

    @ApiProperty({ required: false, description: 'Chuyên ngành' })
    @IsOptional()
    @IsString()
    major?: string;

    @ApiProperty({ required: false, enum: LEVEL_USER, description: 'Trình độ' })
    @IsOptional()
    @IsEnum(LEVEL_USER)
    level?: LEVEL_USER;

    @ApiProperty({ required: false, description: 'Giá tư vấn' })
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiProperty({ required: false, type: [String], enum: CAREER_FAMILY_CODES, description: 'Nhóm ngành tư vấn (tối đa 3)' })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(MAX_EXPERT_CAREER_FAMILIES)
    @IsIn(CAREER_FAMILY_CODES, { each: true })
    careerFamilies?: string[];
}

export class UpdateMemberInfoDto {
    @ApiProperty({ required: false, description: 'Trường trung học phổ thông' })
    @IsOptional()
    @IsString()
    highSchool?: string;
}

export class UpdateUserRequestDto {
    @ApiProperty({ required: false, description: 'Tên người dùng' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false, description: 'ID phường/xã' })
    @IsOptional()
    @IsString()
    wardId?: string;

    @ApiProperty({ required: false, type: UpdateExpertInfoDto, description: 'Thông tin chuyên gia (chỉ dành cho Expert)' })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateExpertInfoDto)
    expertProfile?: UpdateExpertInfoDto;

    @ApiProperty({ required: false, type: UpdateMemberInfoDto, description: 'Thông tin thành viên (chỉ dành cho Member)' })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateMemberInfoDto)
    memberProfile?: UpdateMemberInfoDto;
}
