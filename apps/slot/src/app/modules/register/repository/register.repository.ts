import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Register, RegisterModel, RegisterModelName } from '@common/schemas/slot/register.schema';
import { ObjectId } from "mongodb";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { User } from "@common/schemas/user-access/user.schema";
import { firstValueFrom, map } from "rxjs";

import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { getProcessId } from "@common/utils/string.util";
import { RegisterTcpWithUserResponse } from "@common/interfaces/tcp/register";
import { STATUS_REGISTER_ADVISE } from "@common/constant/enum/status-register-advise.constant";

@Injectable()
export class RegisterRepository {
    constructor(@InjectModel(RegisterModelName) private readonly registerModel: RegisterModel,
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private userAccessClient: TcpClient) { }

    create(data: Partial<Register>) {
        return this.registerModel.create(data);
    }

    async getByIdShiftInDay(id_shift_in_day: ObjectId, isGetUserInfo = false): Promise<(Register[]) | (RegisterTcpWithUserResponse)[]> {
        // lấy thông tin register theo id ngày ca đó
        const rs = await this.registerModel.find({
            day: { $in: [id_shift_in_day] },
            status: STATUS_REGISTER_ADVISE.APPROVE
        }).lean();


        if (!isGetUserInfo) {
            return rs;
        }

        const kq = rs.map(row => {
            const user = firstValueFrom(this.userAccessClient.send<User, { id_user: string, isKeycloak: boolean }>(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_USER_BY_ID, { data: { id_user: row.id_expert, isKeycloak: false }, processId: getProcessId() }).pipe(map(tmp => {
                return {
                    user: tmp.data,
                    register: row
                }
            })))
            return user
        })

        const ketQua = Promise.all(kq);

        return ketQua;
    }

    update(id: string, data: Partial<Register>) {
        return this.registerModel.findByIdAndUpdate(id, data)
    }

    deleteById(id: string) {
        return this.registerModel.findByIdAndDelete(id);
    }

    getAll() {
        return this.registerModel.find()
    }

    getById(id: string) {
        return this.registerModel.findById(id);
    }

    getByIdExpert(id_expert: string) {
        return this.registerModel.findOne({ id_expert: id_expert }).populate({
            path: 'day',
            select: 'day',
            populate: {
                path: 'shift_id',
                select: 'name_shift information start_time end_time'
            },
        })
    }


    async isExistIdExpert(id_expert: string) {
        const rs = await this.registerModel.findOne({ id_expert: id_expert });

        if (rs) {
            return false;
        }

        return true;
    }
}