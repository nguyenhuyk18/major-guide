import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { BadRequestException, Controller, Get, Inject, Param, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { firstValueFrom, map } from "rxjs";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { UpdateAvatarRequestTcp } from '@common/interfaces/tcp/user';
import { UploadedImage } from '@common/interfaces/gateway/common/upload-image.interface';
import { FileUploadDto } from '@common/interfaces/common/file-upload.interface';
import { FileInterceptor } from "@nestjs/platform-express";
import path from 'path'
import { User } from "@common/schemas/user-access/user.schema";


@Controller('user')
@ApiTags('User')
export class UserController {
    constructor(
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly userAccessServie: TcpClient
    ) { }


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
        console.log(file.originalname)

        const ext = path.extname(file.originalname); // .png, .jpg
        const baseName = path.basename(file.originalname, ext);

        const rs = await firstValueFrom(
            this.userAccessServie.send<string, UpdateAvatarRequestTcp>(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_AVATAR_USER, {
                data: {
                    buffer: file.buffer.toString('base64'),
                    fileName: baseName,
                    id_user: id_user
                }, processId
            }).pipe(map(row => new ResponseDto(row)))
        )

        return new ResponseDto({ data: rs })
    }


    @Get('/:id')
    @ApiOperation({ summary: 'Api tìm user theo id' })
    @ApiOkResponse({ type: ResponseDto<User> })
    async findUserById(@Param('id') id: string, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.userAccessServie.send<User, { id_user: string, isKeycloak: boolean }>(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_USER_BY_ID, { data: { id_user: id, isKeycloak: false }, processId }).pipe(map(row => row.data)));

        return new ResponseDto<User>({ data: rs })

    }



}