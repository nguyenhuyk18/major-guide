import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import { LEVEL_USER } from "@common/constant/enum/level-user.constant";
import { ROLE } from "@common/constant/enum/action.constant";

export class ExpertInfoRequest {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    teachAt?: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    information?: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    major?: string

    @ApiProperty({ enum: LEVEL_USER })
    @IsEnum(LEVEL_USER)
    @IsNotEmpty()
    level?: LEVEL_USER
}

export class MemberInfo {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    highSchool: string
}



export class CreateKeyCloakUserRequest {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    username: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    firstname: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    lastname: string


    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    password: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    ward_id: string


    @ApiProperty({ enum: ROLE })
    @IsEnum(ROLE)
    @IsNotEmpty()
    role_name: ROLE

    // @IsBoolean() 
    isExpert: boolean;


    @ApiProperty({ required: false, type: ExpertInfoRequest })
    @ValidateNested()
    @Type(() => ExpertInfoRequest)
    expertProfile?: ExpertInfoRequest;

    @ApiProperty({ required: false, type: MemberInfo })
    @ValidateNested()
    @Type(() => MemberInfo)
    memberProfile?: MemberInfo;
}   