import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { BadRequestException, Controller, Inject, Param, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { firstValueFrom, map } from "rxjs";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { UpdateAvatarRequestTcp } from '@common/interfaces/tcp/user';
import { UploadedImage } from '@common/interfaces/gateway/common/upload-image.interface';
import { FileUploadDto } from '@common/interfaces/common/file-upload.interface';
import { FileInterceptor } from "@nestjs/platform-express";
import path from 'path'


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






}