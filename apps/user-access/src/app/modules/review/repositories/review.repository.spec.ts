import { ReviewRepository } from './review.repository';

describe('ReviewRepository', () => {
    it('rounds the average rating to two decimal places', async () => {
        const model = {
            aggregate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([{
                    averageRating: 4.666666,
                    totalReviews: 3
                }])
            })
        };
        const repository = new ReviewRepository(model as never);

        await expect(repository.getSummary('expert-id')).resolves.toEqual({
            averageRating: 4.67,
            totalReviews: 3
        });
    });

    it('returns zero values when an expert has no reviews', async () => {
        const model = {
            aggregate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([])
            })
        };
        const repository = new ReviewRepository(model as never);

        await expect(repository.getSummary('expert-id')).resolves.toEqual({
            averageRating: 0,
            totalReviews: 0
        });
    });
});
