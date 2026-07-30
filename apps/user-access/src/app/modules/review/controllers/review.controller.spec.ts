import { ReviewController } from './review.controller';

describe('ReviewController', () => {
    it('wraps the service result in a TCP success response', async () => {
        const review = { id: 'review-id', rating: 5 };
        const reviewService = { create: jest.fn().mockResolvedValue(review) };
        const controller = new ReviewController(reviewService as any);

        const response = await controller.create({
            memberId: 'member-id',
            expertId: 'expert-id',
            rating: 5
        });

        expect(response.data).toBe(review);
        expect(response.statusCode).toBe(200);
    });
});
