import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Body, Controller, Inject, Post, UploadedFile } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { User } from '@common/schemas/user-access/user.schema';
import { firstValueFrom, map } from "rxjs";
// import { UserRequestDto } from '@common/interfaces/gateway/user';
import { TCP_AUTHORIZER_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
// import { FileInterceptor } from "@nestjs/platform-express";
import { UploadedImage } from '@common/interfaces/gateway/common/upload-image.interface';
import { UserResponseTcp } from '@common/interfaces/tcp/user';
import { CreateKeyCloakUserRequest } from '@common/interfaces/common/create-user-keyloak-request.interface';
import { LoginRequestDto } from '@common/interfaces/gateway/authorizer'
import { LoginTcpRequest } from '@common/interfaces/tcp/authorizer';
import { ExchangeUserTokenResponse } from '@common/interfaces/common/exchange-token-user-password.interface';

// Tạo một class DTO tạm thời chỉ để phục vụ hiển thị Swagger (kế thừa từ DTO gốc)
// class FileUploadDto extends UserRequestDto {
//     @ApiProperty({ type: 'string', format: 'binary' })
//     file: any;
// }

@Controller('user')
@ApiTags('User')
export class UserController {
    constructor(@Inject(TCP_SERVICE.AUTHORIZER_SERVICE) private readonly authorizerService: TcpClient) { }

    @Post()
    @ApiOkResponse({ type: ResponseDto<User> })
    // @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Đăng ký tài khoản người dùng !!!' })
    // @ApiBody({
    //     description: 'Thông tin user kèm file ảnh',
    //     type: FileUploadDto, // Trỏ vào cái class vừa tạo bên trên
    // })
    // @UseInterceptors(FileInterceptor('file',
    //     {
    //         fileFilter: (req, file, cb) => {
    //             if (file.mimetype === 'image/jpeg') {
    //                 cb(null, true);
    //             } else {
    //                 cb(
    //                     new BadRequestException('Only JPG/JPEG images are allowed'),
    //                     false,
    //                 );
    //             }
    //         },
    //     }
    // ))
    async create(@Body() data: CreateKeyCloakUserRequest, @ProcessId() processId: string, @UploadedFile() file: UploadedImage) {
        // const rs = await firstValueFrom(
        //     this.userClient.send<User, (UserRequestDto & { buff: string, fileName: string })>(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_NEW_USER, {
        //         data: {
        //             ...data,
        //             buff: file.buffer.toString('base64'),
        //             fileName: file.originalname
        //         }, processId
        //     }).pipe(map(row => new ResponseDto(row)))
        // )



        const rs = await firstValueFrom(this.authorizerService.send<UserResponseTcp, CreateKeyCloakUserRequest>(TCP_AUTHORIZER_SERVICE_MESSAGE.CREATE_USER, { processId, data: data }).pipe(map(row => row.data)))


        return new ResponseDto<UserResponseTcp>({ data: rs });
    }


    @Post('user/login')
    @ApiOkResponse({ type: ResponseDto<ExchangeUserTokenResponse> })
    async loginUser(@Body() data: LoginRequestDto, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.authorizerService.send<ExchangeUserTokenResponse, LoginTcpRequest>(TCP_AUTHORIZER_SERVICE_MESSAGE.LOGIN_USER, { processId, data }).pipe(map(row => row.data)))
        return new ResponseDto<ExchangeUserTokenResponse>({ data: rs })
    }


}