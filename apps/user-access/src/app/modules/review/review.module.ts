import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpertReviewDestination } from '@common/schemas/user-access/expert-review.schema';

import { UserDestination } from '@common/schemas/user-access/user.schema';
import { UserRepository } from '../user/repositories/user.repository';
import { ReviewController } from './controllers/review.controller';
import { ReviewRepository } from './repositories/review.repository';
import { ReviewService } from './services/review.service';

@Module({
    imports: [MongooseModule.forFeature([ExpertReviewDestination, UserDestination])],
    controllers: [ReviewController],
    providers: [ReviewRepository, UserRepository, ReviewService],
    exports: [ReviewRepository, ReviewService]
})
export class ReviewModule { }
