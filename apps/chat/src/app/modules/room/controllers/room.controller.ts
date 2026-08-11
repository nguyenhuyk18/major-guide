import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TCP_CHAT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import {
    CreateRoomTcpRequest,
    FindRoomsTcpRequest,
    RoomListItemTcpResponse
} from '@common/interfaces/tcp/chat';
import { Room } from '@common/schemas/chat/room.schema';
import { RoomService } from '../services/room.service';
import { ProcessId } from '@common/decorators/processid.decorator';

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class RoomController {
    constructor(private readonly roomService: RoomService) { }

    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.CREATE_ROOM)
    async create(@RequestParams() data: CreateRoomTcpRequest, @ProcessId() processId: string) {
        return ResponseTcp.success<Room>(await this.roomService.create(data, processId));
    }

    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.GET_ROOMS_BY_PARTICIPANT)
    async findByParticipant(@RequestParams() data: FindRoomsTcpRequest) {
        return ResponseTcp.success<RoomListItemTcpResponse[]>(await this.roomService.findByParticipant(data));
    }
}
