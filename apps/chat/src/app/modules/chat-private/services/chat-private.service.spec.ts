import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ChatPrivateService } from './chat-private.service';

describe('ChatPrivateService', () => {
    const memberId = new ObjectId().toString();
    const expertId = new ObjectId().toString();
    const roomId = new ObjectId().toString();
    const room = { _id: new ObjectId(roomId), id: roomId, id_member: memberId, id_expert: expertId };
    const repository = { create: jest.fn(), findByRoom: jest.fn() };
    const roomService = { getParticipantRoom: jest.fn() };
    const roomRepository = { setMessageActivity: jest.fn(), markRead: jest.fn() };
    const gateway = { emitNewMessage: jest.fn(), emitRoomRead: jest.fn() };
    let service: ChatPrivateService;

    beforeEach(() => {
        jest.clearAllMocks();
        roomService.getParticipantRoom.mockResolvedValue(room);
        service = new ChatPrivateService(
            repository as never, roomService as never, roomRepository as never, gateway as never
        );
    });

    it('saves before broadcasting and ignores any client sender field', async () => {
        const saved = {
            toObject: () => ({ id: 'message-id', content: 'Xin chào', sendBy: memberId, createdAt: new Date() })
        };
        repository.create.mockResolvedValue(saved);
        roomRepository.setMessageActivity.mockResolvedValue(room);
        await service.send({ roomId, content: '  Xin chào  ', requesterId: memberId, requesterRole: 'member' as never });
        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ content: 'Xin chào', sendBy: memberId }));
        expect(gateway.emitNewMessage).toHaveBeenCalled();
        expect(repository.create.mock.invocationCallOrder[0]).toBeLessThan(gateway.emitNewMessage.mock.invocationCallOrder[0]);
    });

    it('rejects empty messages', async () => {
        await expect(service.send({ roomId, content: '   ', requesterId: memberId, requesterRole: 'member' as never }))
            .rejects.toBeInstanceOf(BadRequestException);
    });

    it('resets unread state and emits read event', async () => {
        await service.markRead({ roomId, requesterId: expertId });
        expect(roomRepository.markRead).toHaveBeenCalledWith(room, expertId, expect.any(Date));
        expect(gateway.emitRoomRead).toHaveBeenCalled();
    });
});
