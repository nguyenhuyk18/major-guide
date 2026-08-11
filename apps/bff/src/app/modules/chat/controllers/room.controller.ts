import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Inject,
    Param,
    Post
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom, map } from 'rxjs';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { ROLE } from '@common/constant/enum/action.constant';
import { TCP_CHAT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { UserInfo } from '@common/decorators/get-user.decorator';
import { ProcessId } from '@common/decorators/processid.decorator';
import { Roles } from '@common/decorators/role.decorator';
import { CreateRoomRequestDto } from '@common/interfaces/gateway/chat';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import {
    CreateRoomTcpRequest,
    FindRoomsTcpRequest,
    RoomListItemTcpResponse
} from '@common/interfaces/tcp/chat';
import { Room } from '@common/schemas/chat/room.schema';
import { User } from '@common/schemas/user-access/user.schema';

@ApiTags('Private Chat Rooms')
@Controller('chat-rooms')
export class RoomController {
    constructor(
        @Inject(TCP_SERVICE.CHAT_SERVICE)
        private readonly chatService: TcpClient
    ) { }

    @Post()
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER])
    @ApiOperation({ summary: 'Tạo hoặc lấy room giữa member hiện tại và chuyên gia' })
    async create(
        @Body() body: CreateRoomRequestDto,
        @UserInfo() user: User,
        @ProcessId() processId: string
    ) {
        const data = await firstValueFrom(
            this.chatService.send<Room, CreateRoomTcpRequest>(
                TCP_CHAT_SERVICE_MESSAGE.CREATE_ROOM,
                {
                    processId,
                    data: {
                        memberId: user.id,
                        expertId: body.expertId,
                        nameRoom: body.nameRoom
                    }
                }
            ).pipe(map(response => response.data))
        );
        return new ResponseDto<Room>({ data });
    }

    @Get('me')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER, ROLE.EXPERT])
    @ApiOperation({ summary: 'Lấy room của member hoặc expert đang đăng nhập' })
    findMyRooms(
        @UserInfo() user: User,
        @ProcessId() processId: string
    ) {
        const participantRole = user.roleName === ROLE.EXPERT
            ? ROLE.EXPERT
            : ROLE.MEMBER;
        return this.findRooms(user.id, participantRole, processId);
    }

    @Get('member/:memberId')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER, ROLE.ADMIN])
    @ApiOperation({ summary: 'Lấy room theo ID member' })
    findByMember(
        @Param('memberId') memberId: string,
        @UserInfo() user: User,
        @ProcessId() processId: string
    ) {
        if (user.roleName !== ROLE.ADMIN && user.id !== memberId) {
            throw new ForbiddenException('Bạn không có quyền xem room của member này');
        }
        return this.findRooms(memberId, ROLE.MEMBER, processId);
    }

    @Get('expert/:expertId')
    @Authorization({ secured: true })
    @Roles([ROLE.EXPERT, ROLE.ADMIN])
    @ApiOperation({ summary: 'Lấy room theo ID expert' })
    findByExpert(
        @Param('expertId') expertId: string,
        @UserInfo() user: User,
        @ProcessId() processId: string
    ) {
        if (user.roleName !== ROLE.ADMIN && user.id !== expertId) {
            throw new ForbiddenException('Bạn không có quyền xem room của expert này');
        }
        return this.findRooms(expertId, ROLE.EXPERT, processId);
    }

    private async findRooms(
        participantId: string,
        participantRole: ROLE.MEMBER | ROLE.EXPERT,
        processId: string
    ) {
        const data = await firstValueFrom(
            this.chatService.send<RoomListItemTcpResponse[], FindRoomsTcpRequest>(
                TCP_CHAT_SERVICE_MESSAGE.GET_ROOMS_BY_PARTICIPANT,
                { processId, data: { participantId, participantRole } }
            ).pipe(map(response => response.data))
        );
        return new ResponseDto<RoomListItemTcpResponse[]>({ data });
    }
}
