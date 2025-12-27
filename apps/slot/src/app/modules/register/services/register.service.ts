import { Injectable } from "@nestjs/common";
import { RegisterRepository } from "../repository/register.repository";
import { Register } from "@common/schemas/slot/register.schema";
import { RegisterTcpRequest } from "@common/interfaces/tcp/register";
import { mapperRegister } from "../mapper";
import { STATUS_REGISTER_ADVISE } from "@common/constant/enum/status-register-advise.constant";
// import { getCurrentWeek } from "../../../../helpers/help";
import { getCurrentWeek } from '@common/utils/common/convert-time.util';



@Injectable()
export class RegisterService {
    constructor(private readonly registerRepository: RegisterRepository
    ) { }


    async create(data: Partial<RegisterTcpRequest>) {
        const newData = mapperRegister(data)
        return this.registerRepository.create(newData);
    }

    update(id: string, data: Partial<Register>) {
        return this.registerRepository.update(id, data)
    }

    deleteById(id: string) {
        return this.registerRepository.deleteById(id);
    }

    getAll() {
        return this.registerRepository.getAll()
    }


    async getById(id: string) {
        // lấy thông tin đơn đăng ký
        const registerInfo: Register = await this.registerRepository.getById(id);

        return registerInfo

    }

    getByIdExpert(id_expert: string) {
        return this.registerRepository.getByIdExpert(id_expert);
    }


    async approveTheRegister(id: string) {
        //  lấy đơn đăng ký của người đó mới đăng ký 
        const registerLatest = await this.registerRepository.getById(id);

        // laays danh sách các đơn đăng ký cũ mà đc chấp thuận của một chuyên gia ra
        const getRegisterExpert: Register[] = await this.registerRepository.getAll({ id_expert: registerLatest.id_expert, status: STATUS_REGISTER_ADVISE.APPROVE }, { available_date: -1 });

        // lấy ngày chủ nhật của 2 tuần sau ra làm mốc để sang ngày thứ 2 thành lịch hợp lệ
        const dateExpire = new Date();
        dateExpire.setDate(dateExpire.getDate() + 14);
        const finalDateExpire = getCurrentWeek(dateExpire);
        const mondayInWeekAfter = finalDateExpire[0].setDate(finalDateExpire[0].getDate() - 1);

        console.log(getRegisterExpert.length);

        // kiểm tra có đơn cũ không nếu có thì lấy cái đơn gần mới nhất ra để cập nhật cái ngày đơn đó sẽ cút
        if (getRegisterExpert.length) {
            const tmp = getRegisterExpert[0];
            tmp.unavailable_date = new Date(mondayInWeekAfter);
            await this.registerRepository.update(String(tmp._id), { unavailable_date: tmp.unavailable_date })
        }
        else {
            const newDate = new Date();
            newDate.setDate(newDate.getDate());
            const finalDateExpire = getCurrentWeek(newDate);
            const mondayInWeekAfter = finalDateExpire[0].setDate(finalDateExpire[0].getDate() - 1);
            console.log(new Date(mondayInWeekAfter));
            const info = await this.registerRepository.update(id, { status: STATUS_REGISTER_ADVISE.APPROVE, available_date: new Date(mondayInWeekAfter) });
            return info
        }

        // cập nhật ngày availble
        const info = await this.registerRepository.update(id, { status: STATUS_REGISTER_ADVISE.APPROVE, available_date: new Date(mondayInWeekAfter) });

        return info
    }






}