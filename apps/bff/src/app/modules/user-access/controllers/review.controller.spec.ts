import { of } from 'rxjs';
import { ROLE } from '@common/constant/enum/action.constant';
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';

jest.mock('@common/utils/string.util', () => ({
    getProcessId: jest.fn(() => 'process-id')
}));

import { ReviewController } from './review.controller';

describe('BFF ReviewController', () => {
    const client = { send: jest.fn() };
    const controller = new ReviewController(client as any);

    beforeEach(() => jest.clearAllMocks());

    it('uses the authenticated member id instead of accepting it from body', async () => {
        client.send.mockReturnValue(of({ data: { id: 'review-id', rating: 5 } }));

        const response = await controller.create(
            'expert-id',
            { rating: 5 },
            { id: 'authenticated-member', roleName: ROLE.MEMBER } as any,
            'process-id'
        );

        expect(client.send).toHaveBeenCalledWith(
            TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_EXPERT_REVIEW,
            expect.objectContaining({
                data: expect.objectContaining({ memberId: 'authenticated-member' })
            })
        );
        expect(response.data).toEqual({ id: 'review-id', rating: 5 });
    });

    it('passes admin identity and role when deleting a review', async () => {
        client.send.mockReturnValue(of({ data: { id: 'review-id' } }));

        await controller.delete(
            'review-id',
            { id: 'admin-id', roleName: ROLE.ADMIN } as any,
            'process-id'
        );

        expect(client.send).toHaveBeenCalledWith(
            TCP_USER_ACCESS_SERVICE_MESSAGE.DELETE_EXPERT_REVIEW,
            expect.objectContaining({
                data: expect.objectContaining({
                    requesterId: 'admin-id',
                    requesterRole: ROLE.ADMIN
                })
            })
        );
    });
});
