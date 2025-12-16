import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserModel, UserModelName } from '@common/schemas/user-access/user.schema';

@Injectable()
export class UserRepository {
    constructor(@InjectModel(UserModelName) private readonly userModel: UserModel) { }

    create(data: Partial<User>) {
        return this.userModel.create(data);
    }


    async isExistEmail(email: string) {
        const rs = await this.userModel.findOne({ email }).exec();
        return !!rs;
    }


    getByUserId(userId: string) {
        const rs = this.userModel.findOne({ userId: userId });
        return rs;
    }


}