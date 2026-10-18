import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CareerAssessmentDestination } from '@common/schemas/user-access/career-assessment.schema';
import { UserDestination } from '@common/schemas/user-access/user.schema';
import { CareerAssessmentController } from './career-assessment.controller';
import { CareerAssessmentRepository } from './career-assessment.repository';
import { CareerAssessmentService } from './career-assessment.service';
import { CareerExpertService } from './career-expert.service';
import { CareerModelClient } from './career-model.client';

@Module({
  imports: [MongooseModule.forFeature([CareerAssessmentDestination, UserDestination])],
  controllers: [CareerAssessmentController],
  providers: [
    CareerAssessmentRepository,
    CareerAssessmentService,
    CareerModelClient,
    CareerExpertService,
  ],
})
export class CareerAssessmentModule {}
