import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, IsEnum, ValidateNested } from "class-validator";
// import { Type } from "class-transformer";
// import { LEVEL_USER } from "@common/constant/enum/level-user.constant";
import { StatusAccount } from "@common/constant/enum/status-account.constant";

export class UpdateStatusUserDto {



    @ApiProperty({ required: true, description: 'ID người dùng' })
    // @IsOptional()
    // @IsEnum(LEVEL_USER)
    id_user?: string;

    @ApiProperty({ required: true, description: 'trạng thái tài khoản' })
    // @IsOptional()
    // @IsNumber()
    status?: StatusAccount;
}
