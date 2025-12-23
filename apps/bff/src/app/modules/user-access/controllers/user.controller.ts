import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { BadRequestException, Body, Controller, Inject, Param, Post, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { User } from '@common/schemas/user-access/user.schema';
import { firstValueFrom, map } from "rxjs";
// import { UserRequestDto } from '@common/interfaces/gateway/user';
import { TCP_AUTHORIZER_SERVICE_MESSAGE, TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
// import { FileInterceptor } from "@nestjs/platform-express";
import { UpdateAvatarRequestTcp } from '@common/interfaces/tcp/user';
import { UploadedImage } from '@common/interfaces/gateway/common/upload-image.interface';
import { UserResponseTcp } from '@common/interfaces/tcp/user';
import { CreateKeyCloakUserRequest } from '@common/interfaces/common/create-user-keyloak-request.interface';
import { LoginRequestDto } from '@common/interfaces/gateway/authorizer'
import { LoginTcpRequest } from '@common/interfaces/tcp/authorizer';
import { ExchangeUserTokenResponse } from '@common/interfaces/common/exchange-token-user-password.interface';
import { FileUploadDto } from '@common/interfaces/common/file-upload.interface';
import { FileInterceptor } from "@nestjs/platform-express";

// Tạo một class DTO tạm thời chỉ để phục vụ hiển thị Swagger (kế thừa từ DTO gốc)
// class FileUploadDto extends UserRequestDto {
//     @ApiProperty({ type: 'string', format: 'binary' })
//     file: any;
// }

@Controller('user')
@ApiTags('User')
export class UserController {
    constructor(@Inject(TCP_SERVICE.AUTHORIZER_SERVICE) private readonly authorizerService: TcpClient,
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly userAccessServie: TcpClient
    ) { }

    @Post()
    @ApiOkResponse({ type: ResponseDto<User> })
    @ApiOperation({ summary: 'Đăng ký tài khoản người dùng !!!' })
    async create(@Body() data: CreateKeyCloakUserRequest, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.authorizerService.send<UserResponseTcp, CreateKeyCloakUserRequest>(TCP_AUTHORIZER_SERVICE_MESSAGE.CREATE_USER, { processId, data: data }).pipe(map(row => row.data)))
        return new ResponseDto<UserResponseTcp>({ data: rs });
    }

    @Put('/upload-image/:id')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Api cập nhật ảnh đại diện' })
    @ApiBody({
        description: 'Thông tin user kèm file ảnh',
        type: FileUploadDto,
    })
    @UseInterceptors(FileInterceptor('file',
        {
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'image/jpeg') {
                    cb(null, true);
                } else {
                    cb(
                        new BadRequestException('Only JPG/JPEG images are allowed'),
                        false,
                    );
                }
            },
        }
    ))
    async updateAvatarUser(@UploadedFile() file: UploadedImage, @ProcessId() processId: string, @Param("id") id_user: string) {
        const rs = await firstValueFrom(
            this.userAccessServie.send<string, UpdateAvatarRequestTcp>(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_AVATAR_USER, {
                data: {
                    buffer: file.buffer.toString('base64'),
                    fileName: file.originalname,
                    id_user: id_user
                }, processId
            }).pipe(map(row => new ResponseDto(row)))
        )

        return new ResponseDto({ data: rs })
    }

    @Post('login')
    @ApiOkResponse({ type: ResponseDto<ExchangeUserTokenResponse> })
    async loginUser(@Body() data: LoginRequestDto, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.authorizerService.send<ExchangeUserTokenResponse, LoginTcpRequest>(TCP_AUTHORIZER_SERVICE_MESSAGE.LOGIN_USER, { processId, data }).pipe(map(row => row.data)))
        return new ResponseDto<ExchangeUserTokenResponse>({ data: rs })
    }





}