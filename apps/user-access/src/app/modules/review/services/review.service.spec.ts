import { ForbiddenException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ROLE } from '@common/constant/enum/action.constant';
import { StatusAccount } from '@common/constant/enum/status-account.constant';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
    const memberId = new ObjectId().toString();
    const expertId = new ObjectId().toString();
    const reviewId = new ObjectId().toString();

    const reviewRepository = {
        create: jest.fn(),
        findById: jest.fn(),
        updateById: jest.fn(),
        deleteById: jest.fn(),
        findByExpertId: jest.fn(),
        getSummary: jest.fn()
    };
    const userRepository = {
        getById: jest.fn(),
        getByIds: jest.fn()
    };
    let service: ReviewService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ReviewService(reviewRepository as any, userRepository as any);
    });

    it('creates multiple reviews without checking uniqueness', async () => {
        userRepository.getById.mockImplementation((id: string) => Promise.resolve(
            id === memberId
                ? { id: memberId, roleName: ROLE.MEMBER, name: 'Member' }
                : { id: expertId, roleName: ROLE.EXPERT, statusAccount: StatusAccount.ACTIVE }
        ));
        reviewRepository.create.mockResolvedValue({
            toObject: () => ({
                _id: reviewId,
                memberId,
                expertId,
                rating: 5,
                comment: 'Tốt',
                createdAt: new Date(),
                updatedAt: new Date()
            })
        });

        await service.create({ memberId, expertId, rating: 5, comment: '  Tốt  ' });
        await service.create({ memberId, expertId, rating: 5, comment: '  Tốt  ' });

        expect(reviewRepository.create).toHaveBeenCalledTimes(2);
        expect(reviewRepository.create).toHaveBeenLastCalledWith(
            expect.objectContaining({ comment: 'Tốt' })
        );
    });

    it('prevents a member from updating another member review', async () => {
        reviewRepository.findById.mockResolvedValue({
            _id: reviewId,
            memberId: new ObjectId().toString()
        });

        await expect(service.update({
            reviewId,
            requesterId: memberId,
            requesterRole: ROLE.MEMBER,
            rating: 4
        })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('clears an existing comment when member saves an empty comment', async () => {
        reviewRepository.findById.mockResolvedValue({
            _id: reviewId,
            memberId
        });
        reviewRepository.updateById.mockResolvedValue({
            _id: reviewId,
            memberId,
            expertId,
            rating: 4,
            comment: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        userRepository.getById.mockResolvedValue({ id: memberId, roleName: ROLE.MEMBER });

        await service.update({
            reviewId,
            requesterId: memberId,
            requesterRole: ROLE.MEMBER,
            rating: 4,
            comment: ''
        });

        expect(reviewRepository.updateById).toHaveBeenCalledWith(reviewId, {
            rating: 4,
            comment: null
        });
    });

    it('allows admin to delete any review', async () => {
        reviewRepository.findById.mockResolvedValue({ _id: reviewId, memberId });
        reviewRepository.deleteById.mockResolvedValue({ _id: reviewId });

        await expect(service.delete({
            reviewId,
            requesterId: new ObjectId().toString(),
            requesterRole: ROLE.ADMIN
        })).resolves.toEqual({ id: reviewId });
    });

    it('returns paginated reviews with current reviewer details', async () => {
        userRepository.getById.mockResolvedValue({
            id: expertId,
            roleName: ROLE.EXPERT,
            statusAccount: StatusAccount.ACTIVE
        });
        reviewRepository.getSummary.mockResolvedValue({
            averageRating: 4.5,
            totalReviews: 2
        });
        reviewRepository.findByExpertId.mockResolvedValue([{
            _id: reviewId,
            memberId,
            expertId,
            rating: 5,
            createdAt: new Date(),
            updatedAt: new Date()
        }]);
        userRepository.getByIds.mockResolvedValue([{
            id: memberId,
            name: 'Member',
            fileAvartarUrl: 'avatar.jpg'
        }]);

        const result = await service.getByExpert(expertId, 1, 10);

        expect(result.averageRating).toBe(4.5);
        expect(result.totalPages).toBe(1);
        expect(result.reviews[0].reviewer).toEqual({
            id: memberId,
            name: 'Member',
            avatar: 'avatar.jpg'
        });
    });
});
