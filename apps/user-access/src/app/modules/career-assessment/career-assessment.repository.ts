import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CareerAssessment,
  CareerAssessmentModel,
  CareerAssessmentModelName,
} from '@common/schemas/user-access/career-assessment.schema';

@Injectable()
export class CareerAssessmentRepository {
  constructor(
    @InjectModel(CareerAssessmentModelName)
    private readonly model: CareerAssessmentModel
  ) {}
  create(data: Partial<CareerAssessment>) {
    return this.model.create(data);
  }
  findById(id: string) {
    return this.model.findById(id).lean().exec();
  }
  findActive(userId: string, assessmentVersion = 'career-v4') {
    return this.model
      .findOne({ userId, status: 'in_progress', assessmentVersion })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
  findByUser(userId: string) {
    return this.model.find({ userId }).sort({ createdAt: -1 }).lean().exec();
  }
  update(id: string, data: Partial<CareerAssessment>) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).lean().exec();
  }
}
