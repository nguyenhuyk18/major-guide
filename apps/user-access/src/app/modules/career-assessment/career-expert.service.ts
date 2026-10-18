import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ROLE } from '@common/constant/enum/action.constant';
import { StatusAccount } from '@common/constant/enum/status-account.constant';
import { UserModel, UserModelName } from '@common/schemas/user-access/user.schema';
import { ExpertRecord, rankExperts } from './expert-matching';

/** Experts to recommend on the career-test result page. */
@Injectable()
export class CareerExpertService {
  constructor(@InjectModel(UserModelName) private readonly userModel: UserModel) {}

  async recommend(families: string[] | string, limit = 4) {
    const codes = (Array.isArray(families) ? families : String(families ?? '').split(','))
      .map((code) => code.trim())
      .filter(Boolean);
    if (!codes.length) return [];
    const experts = await this.userModel
      .find({ roleName: ROLE.EXPERT, statusAccount: StatusAccount.ACTIVE })
      .select('name fileAvartarUrl expertProfile')
      .lean<ExpertRecord[]>()
      .exec();
    return rankExperts(codes, experts, Math.min(Math.max(Number(limit) || 4, 1), 8));
  }
}
