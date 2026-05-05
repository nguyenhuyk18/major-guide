import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TCP_MEDIA_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Body, Controller, Delete, FileTypeValidator, Get, Inject, MaxFileSizeValidator, Param, ParseFilePipe, Post, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Authorization } from "@common/decorators/authorizer.decorator";
import { Roles } from "@common/decorators/role.decorator";
import { ROLE } from "@common/constant/enum/action.constant";
import { firstValueFrom, map } from 'rxjs';
import { UserInfo } from "@common/decorators/get-user.decorator";
import { User } from "@common/schemas/user-access/user.schema";
import { UploadedFile as UploadedFileInterface } from "../interfaces/uploaded-file.interface";

@ApiTags('Post')
@Controller('post')
export class PostController {

    constructor(@Inject(TCP_SERVICE.MEDIA_SERVICE) private readonly mediaService: TcpClient) { }

    @Post()
    @ApiOkResponse({ type: ResponseDto })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Tiêu đề bài viết' },
                content: { type: 'string', description: 'Nội dung bài viết' },
                file: { type: 'string', format: 'binary', description: 'Ảnh bài viết' }
            }
        }
    })
    @UseInterceptors(FileInterceptor('file'))
    @Authorization({ secured: true })
    @Roles([ROLE.EXPERT, ROLE.ADMIN])
    @ApiOperation({ summary: 'API tạo bài viết - tự động upload ảnh lên Cloudinary' })
    async createPost(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/i }),
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })
                ]
            })
        ) file: UploadedFileInterface,
        @Body('title') title: string,
        @Body('content') content: string,
        @ProcessId() processId: string,
        @UserInfo() userInfo: User
    ) {
        const base64Buffer = file.buffer.toString('base64');
        const fileName = `${Date.now()}-${file.originalname}`;

        const uploadResult = await firstValueFrom(
            this.mediaService.send<any, any>(
                TCP_MEDIA_SERVICE_MESSAGE.UPLOAD_IMAGE,
                { data: { fileBuffer: base64Buffer, fileName }, processId }
            )
        );

        const imageUrl = uploadResult.data.url;

        const payload = {
            title,
            content,
            imageUrl,
            expertId: userInfo.id
        };

        const result = await firstValueFrom(
            this.mediaService.send<any, any>(
                TCP_MEDIA_SERVICE_MESSAGE.CREATE_POST,
                { data: payload, processId }
            )
        );
        return new ResponseDto(result.data);
    }

    @Get()
    @ApiOkResponse({ type: ResponseDto })
    @ApiOperation({ summary: 'API lấy tất cả bài viết' })
    async getAllPosts(@ProcessId() processId: string) {
        const result = await firstValueFrom(
            this.mediaService.send<any, any>(
                TCP_MEDIA_SERVICE_MESSAGE.GET_ALL_POSTS,
                { data: {}, processId }
            ).pipe(map((result) => new ResponseDto( result )))
        );
        return result;
    }

    @Get('expert/:expertId')
    @ApiOkResponse({ type: ResponseDto })
    @ApiOperation({ summary: 'API lấy bài viết theo ID chuyên gia' })
    async getPostsByExpert(
        @Param('expertId') expertId: string,
        @ProcessId() processId: string
    ) {
        const result = await firstValueFrom(
            this.mediaService.send<any, any>(
                TCP_MEDIA_SERVICE_MESSAGE.GET_POSTS_BY_EXPERT,
                { data: { expertId }, processId }
            )
        );
        return new ResponseDto(result.data);
    }

    @Get(':id')
    @ApiOkResponse({ type: ResponseDto })
    @ApiOperation({ summary: 'API lấy bài viết theo ID' })
    async getPostById(
        @Param('id') id: string,
        @ProcessId() processId: string
    ) {
        const result = await firstValueFrom(
            this.mediaService.send<any, any>(
                TCP_MEDIA_SERVICE_MESSAGE.GET_POST_BY_ID,
                { data: { id }, processId }
            )
        );
        return new ResponseDto(result.data);
    }

    @Put(':id')
    @ApiOkResponse({ type: ResponseDto })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Tiêu đề bài viết' },
                content: { type: 'string', description: 'Nội dung bài viết' },
                file: { type: 'string', format: 'binary', description: 'Ảnh bài viết mới (tùy chọn)' }
            }
        }
    })
    @UseInterceptors(FileInterceptor('file'))
    @Authorization({ secured: true })
    @Roles([ROLE.EXPERT, ROLE.ADMIN])
    @ApiOperation({ summary: 'API cập nhật bài viết - tự động upload ảnh mới lên Cloudinary nếu có' })
    async updatePost(
        @Param('id') id: string,
        @UploadedFile() file: UploadedFileInterface | undefined,
        @Body('title') title: string,
        @Body('content') content: string,
        @ProcessId() processId: string
    ) {
        const payload: any = { id, title, content };

        if (file) {
            const base64Buffer = file.buffer.toString('base64');
            const fileName = `${Date.now()}-${file.originalname}`;

            const uploadResult = await firstValueFrom(
                this.mediaService.send<any, any>(
                    TCP_MEDIA_SERVICE_MESSAGE.UPLOAD_IMAGE,
                    { data: { fileBuffer: base64Buffer, fileName }, processId }
                )
            );
            payload.imageUrl = uploadResult.data.url;
            payload.isNewImage = true;
        }

        const result = await firstValueFrom(
            this.mediaService.send<any, any>(
                TCP_MEDIA_SERVICE_MESSAGE.UPDATE_POST,
                { data: payload, processId }
            )
        );
        return new ResponseDto(result.data);
    }

    @Delete(':id')
    @ApiOkResponse({ type: ResponseDto })
    @Authorization({ secured: true })
    @Roles([ROLE.EXPERT, ROLE.ADMIN])
    @ApiOperation({ summary: 'API xóa bài viết' })
    async deletePost(
        @Param('id') id: string,
        @ProcessId() processId: string
    ) {
        const result = await firstValueFrom(
            this.mediaService.send<any, any>(
                TCP_MEDIA_SERVICE_MESSAGE.DELETE_POST,
                { data: { id }, processId }
            )
        );
        return new ResponseDto(result.data);
    }
}
