import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { of } from 'rxjs';
import { ROLE } from '@common/constant/enum/action.constant';
import { StatusAccount } from '@common/constant/enum/status-account.constant';
import { RoomService } from './room.service';

describe('RoomService', () => {
    const memberId = new ObjectId().toString();
    const expertId = new ObjectId().toString();
    const roomId = new ObjectId().toString();
    const repository = {
        create: jest.fn(),
        findByParticipants: jest.fn(),
        findByParticipant: jest.fn(),
        findById: jest.fn()
    };
    const userAccessClient = { send: jest.fn() };
    let service: RoomService;

    beforeEach(() => {
        jest.clearAllMocks();
        userAccessClient.send.mockReturnValue(of({
            data: { id: expertId, roleName: ROLE.EXPERT, statusAccount: StatusAccount.ACTIVE }
        }));
        service = new RoomService(repository as never, userAccessClient as never);
    });

    it('returns the existing room for the same member and expert', async () => {
        const room = { _id: roomId, id_member: memberId, id_expert: expertId };
        repository.findByParticipants.mockResolvedValue(room);
        await expect(service.create({ memberId, expertId }, 'process')).resolves.toBe(room);
        expect(repository.create).not.toHaveBeenCalled();
    });

    it('creates a room for any active expert without checking booking', async () => {
        repository.findByParticipants.mockResolvedValue(null);
        repository.create.mockResolvedValue({ _id: roomId });
        await service.create({ memberId, expertId, nameRoom: '  Tư vấn  ' }, 'process');
        expect(repository.create).toHaveBeenCalledWith({
            name_room: 'Tư vấn', id_member: memberId, id_expert: expertId
        });
    });

    it('rejects a user who is not an active expert', async () => {
        userAccessClient.send.mockReturnValue(of({
            data: { id: expertId, roleName: ROLE.MEMBER, statusAccount: StatusAccount.ACTIVE }
        }));
        await expect(service.create({ memberId, expertId }, 'process'))
            .rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects access by a non-participant', async () => {
        repository.findById.mockResolvedValue({ id_member: memberId, id_expert: expertId });
        await expect(service.getParticipantRoom(roomId, new ObjectId().toString()))
            .rejects.toBeInstanceOf(ForbiddenException);
    });
});
