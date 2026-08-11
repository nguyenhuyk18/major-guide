import { of } from 'rxjs';
import { ROLE } from '@common/constant/enum/action.constant';
import { TCP_CHAT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';

jest.mock('@common/utils/string.util', () => ({
    getProcessId: jest.fn(() => 'process-id')
}));

import { RoomController } from './room.controller';

describe('BFF RoomController', () => {
    const chatService = { send: jest.fn() };
    const controller = new RoomController(chatService as never);

    beforeEach(() => jest.clearAllMocks());

    it('always takes memberId from the verified token user', async () => {
        chatService.send.mockReturnValue(of({
            data: { id: 'room-id', id_member: 'verified-member' }
        }));

        await controller.create(
            { expertId: 'expert-id', nameRoom: 'Room' },
            { id: 'verified-member', roleName: ROLE.MEMBER } as never,
            'process-id'
        );

        expect(chatService.send).toHaveBeenCalledWith(
            TCP_CHAT_SERVICE_MESSAGE.CREATE_ROOM,
            {
                processId: 'process-id',
                data: {
                    memberId: 'verified-member',
                    expertId: 'expert-id',
                    nameRoom: 'Room'
                }
            }
        );
    });
});
