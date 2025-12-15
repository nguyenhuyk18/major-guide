import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { BadRequestException, Body, Controller, Inject, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { User } from '@common/schemas/user-access/user.schema';
import { firstValueFrom, map } from "rxjs";
import { UserRequestDto } from '@common/interfaces/gateway/user';
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadedImage } from '@common/interfaces/gateway/common/upload-image.interface';

// Tạo một class DTO tạm thời chỉ để phục vụ hiển thị Swagger (kế thừa từ DTO gốc)
// class FileUploadDto extends UserRequestDto {
//     @ApiProperty({ type: 'string', format: 'binary' })
//     file: any;
// }

@Controller('user')
@ApiTags('User')
export class UserController {
    constructor(@Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly userClient: TcpClient) { }

    // @Post()
    // @ApiOkResponse({ type: ResponseDto<User> })
    // @ApiConsumes('multipart/form-data')
    // @ApiOperation({ summary: 'Thêm người dùng mới !!!!' })
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
    // async create(@Body() data: UserRequestDto, @ProcessId() processId: string, @UploadedFile() file: UploadedImage) {
    //     const rs = await firstValueFrom(
    //         this.userClient.send<User, (UserRequestDto & { buff: string, fileName: string })>(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_NEW_USER, {
    //             data: {
    //                 ...data,
    //                 buff: file.buffer.toString('base64'),
    //                 fileName: file.originalname
    //             }, processId
    //         }).pipe(map(row => new ResponseDto(row)))
    //     )
    //     return rs;
    // }

}