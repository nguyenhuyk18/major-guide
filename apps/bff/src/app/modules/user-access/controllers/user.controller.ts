import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { BadRequestException, Controller, Get, Inject, Param, Put, Query, UploadedFile, UseInterceptors, Post, Body } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
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
import { Authorization } from "@common/decorators/authorizer.decorator";
import { ROLE } from "@common/constant/enum/action.constant";
import { PaginationResponse } from "@common/interfaces/tcp/common/pagegination-tcp.interface";
import { StatusAccount } from "@common/constant/enum/status-account.constant";
import { FindUserByIds, UpdateUserRequestDto } from '@common/interfaces/gateway/user';
import { UpdateUserRequestTcp } from '@common/interfaces/tcp/user';
import { ContactMailRequest, ContactMailResponse } from '@common/interfaces/gateway/mail';
import { Roles } from "@common/decorators/role.decorator";
import { UpdateStatusUserDto } from "@common/interfaces/gateway/user/update-status-user.interface";

@Controller('user')
@ApiTags('User')
export class UserController {
    constructor(
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly userAccessServie: TcpClient
    ) { }

    @Post('/many-user')
    @ApiOperation({ summary: 'Api tìm user theo id' })
    @ApiOkResponse({ type: ResponseDto<{ [k: string]: User }> })
    async getUserByIds(@Body() data: FindUserByIds, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.userAccessServie.send<{ [k: string]: User }, FindUserByIds>(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_USER_BY_IDS, { data: data, processId }).pipe(map(row => row.data)));

        return new ResponseDto<{ [k: string]: User }>({ data: rs });
    }

    @Put('/upload-image/:id')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Api cập nhật ảnh đại diện' })
    @ApiBody({
        description: 'Thông tin user kèm file ảnh',
        type: FileUploadDto,
    })
    @Authorization({ secured: true })
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
        // console.log(file.originalname)

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


    @Get()
    @ApiOperation({ summary: 'Api này để lấy ra toàn bộ chuyên gia (có phân trang)' })
    // @ApiOkResponse({ type: ResponseDto<User> })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'role', required: false, type: String })
    @ApiQuery({ name: 'sort', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiQuery({ name: 'name', required: false, type: String })
    async getAllUser(@ProcessId() processId: string, @Query('name') name: string, @Query('status') status: StatusAccount, @Query('limit') limit?: number, @Query('page') page?: number, @Query('role') role?: ROLE, @Query('sort') sort?: string) {
        const rs = await firstValueFrom(this.userAccessServie.send<PaginationResponse<Partial<User>>, { limit: number | undefined, page: number | undefined, role: ROLE | undefined, sort: string | undefined, status: StatusAccount | undefined, name: string | undefined }>(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_USER, {
            processId: processId, data: {
                limit, page, role, sort, status, name
            }
        }).pipe(map(row => row.data)));
        // console.log(rs);
        return new ResponseDto<PaginationResponse<Partial<User>>>({ data: rs });
    }


    @Put('/:id')
    @ApiOperation({ summary: 'API chỉnh sửa thông tin user (dựa trên role)' })
    @ApiOkResponse({ type: ResponseDto<User> })
    @Authorization({ secured: true })
    async updateUserProfile(
        @Param('id') userId: string,
        @Body() updateData: UpdateUserRequestDto,
        @ProcessId() processId: string
    ) {
        const tcpPayload: UpdateUserRequestTcp = {
            userId,
            ...updateData
        };

        // console.log(tcpPayload);

        const rs = await firstValueFrom(
            this.userAccessServie.send<User, UpdateUserRequestTcp>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_USER_PROFILE,
                { data: tcpPayload, processId }
            ).pipe(map(row => row.data))
        );

        return new ResponseDto<User>({ data: rs });
    }


    @Post('/contact')
    @ApiOperation({ summary: 'API gửi email' })
    async sendEmailContact(@Body() data: ContactMailRequest, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.userAccessServie.send<ContactMailResponse, ContactMailRequest>(TCP_USER_ACCESS_SERVICE_MESSAGE.CONTACT_TO_SUPPORT, { data: data, processId }).pipe(map(row => row.data)));

        return new ResponseDto<ContactMailResponse>({ data: rs });
    }

    @Put('/update-status-account')
    @ApiOperation({ summary: 'API cập nhật trạng thái tài khoản' })
    @ApiOkResponse({ type: ResponseDto<User> })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async updateStatusAccount(@Body() data: UpdateStatusUserDto , @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.userAccessServie.send<User, UpdateStatusUserDto>(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_STATUS_ACCOUNT, { data: data, processId }).pipe(map(row => row.data)));
        return new ResponseDto<User>({ data: rs });
    }


}