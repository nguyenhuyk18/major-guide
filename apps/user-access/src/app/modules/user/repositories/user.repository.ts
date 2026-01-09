import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserModel, UserModelName } from '@common/schemas/user-access/user.schema';
import { Filter, ObjectId } from "mongodb";
import { ROLE } from "@common/constant/enum/action.constant";



@Injectable()
export class UserRepository {
    constructor(@InjectModel(UserModelName) private readonly userModel: UserModel) { }

    create(data: Partial<User>) {
        return this.userModel.create(data);
    }

    private getAllUser(cond: Filter<User> = {}, sortigation = null, skip = null, limit = null, roleNeed: ROLE[] = []) {

        // console.log(skip, '       ', limit)

        const rs = this.userModel.find(cond);

        if (roleNeed.length) {
            rs.find({ roleName: { $in: roleNeed }, ...cond });
        }

        if (sortigation) {
            rs.sort(sortigation);
        }

        if (skip != null && limit) {
            rs.skip(skip).limit(limit)
        }

        return rs.lean().exec();
    }


    async fetchAll(cond: Filter<User> = {}, limit = 6, index = 0, roleNeed: ROLE[] = [], sortigation = null) {
        // console.log(cond, sortigation, limit * index, limit, roleNeed)
        // console.log(limit * index)
        const rs = await this.getAllUser(cond, sortigation, limit * index, limit, roleNeed);
        // console.log(rs);
        return rs;
    }


    async fetchNumber(roleNeed: ROLE[] = [], cond: Filter<User> = {}) {
        const rs = await this.getAllUser(cond, null, null, null, roleNeed);
        return rs.length;
    }

    async isExistEmail(email: string) {
        const rs = await this.userModel.findOne({ email }).exec();
        return !!rs;
    }


    getByUserId(userId: string) {
        const rs = this.userModel.findOne({ userId: userId });
        return rs;
    }

    getById(id: string) {
        const rs = this.userModel.findById(id);
        return rs;
    }

    getByIds(ids: string[]) {
        const newId = ids.map(row => new ObjectId(row))
        // console.log(newId);
        const rs = this.userModel.find({
            _id: { $in: newId }
        });
        return rs;
    }


    updateUserById(id: string, data: Partial<User>) {
        const rs = this.userModel.findByIdAndUpdate(id, data);
        return rs;
    }


}