import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { RegisterRepository } from "../repository/register.repository";
import { Register } from "@common/schemas/slot/register.schema";
import { RegisterTcpRequest } from "@common/interfaces/tcp/register";
import { mapperRegister } from "../mapper";
import { STATUS_REGISTER_ADVISE } from "@common/constant/enum/status-register-advise.constant";
import { getCurrentWeek } from '@common/utils/common/convert-time.util';
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { firstValueFrom, map } from "rxjs";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { User } from "@common/schemas/user-access/user.schema";
import { PaginationResponse } from "@common/interfaces/tcp/common/pagegination-tcp.interface";
import { TCP_SERVICE } from "@common/configuration/tcp.config";



@Injectable()
export class RegisterService {
    constructor(private readonly registerRepository: RegisterRepository,
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly userAccessClient: TcpClient
    ) { }


    async create(data: Partial<RegisterTcpRequest>) {
        const newData = mapperRegister(data)

        const check = await this.registerRepository.getAll({ id_expert: newData.id_expert, status: STATUS_REGISTER_ADVISE.UNREVIEWED })
        if (check.length) {
            throw new BadRequestException('Bạn đã có 1 đơn đăng ký chưa được duyệt, không thể thêm đơn mới !!')
        }

        return this.registerRepository.create(newData);
    }

    update(id: string, data: Partial<Register>) {
        return this.registerRepository.update(id, data)
    }

    deleteById(id: string) {
        return this.registerRepository.deleteById(id);
    }

    async getAll(page: number, cond: Partial<Register> = {}, processId: string) {
        const index = page - 1;
        const skip = index * 6;

        const rs = await this.registerRepository.getToPagination(cond, 6, skip);

        if (!rs.length) {
            throw new BadRequestException('Không có đơn đăng ký nào !!!')
        }

        const ids = rs.map(row => {
            return row.id_expert;
        })
        // console.log('sdfsfdf');
        const userMap = await firstValueFrom(this.userAccessClient.send<{ [k: string]: User }, { ids: string[] }>(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_USER_BY_IDS, { data: { ids: ids }, processId }).pipe(map(row => row.data)));

        // console.log(userMap)

        const amountRegister = await this.registerRepository.getAll(cond, null);
        const totalPage = Math.ceil(amountRegister.length / 6)
        // console.log(totalPage, 'con cu');

        const kq: (Register & Partial<User>)[] = rs.map(row => {
            return {
                ...row,
                fileAvartarUrl: userMap[row.id_expert].fileAvartarUrl,
                name: userMap[row.id_expert].name,
            }
        });

        return {
            result: kq,
            totalPage
        } as PaginationResponse<Register & User>;

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
        const getRegisterExpert: Register[] = await this.registerRepository.getAll({ id_expert: registerLatest.id_expert, status: STATUS_REGISTER_ADVISE.APPROVE }, { _id: -1 });

        // lấy ngày chủ nhật của 2 tuần sau ra làm mốc để sang ngày thứ 2 thành lịch hợp lệ
        const dateExpire = new Date();
        dateExpire.setDate(dateExpire.getDate() + 14);
        const finalDateExpire = getCurrentWeek(dateExpire);
        // console.log(finalDateExpire)
        // console.log(new Date(dateExpire))
        const mondayInWeekAfter = finalDateExpire[0].setDate(finalDateExpire[0].getDate() - 1);

        // console.log(getRegisterExpert.length);

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
            // console.log(new Date(mondayInWeekAfter));
            const info = await this.registerRepository.update(id, { status: STATUS_REGISTER_ADVISE.APPROVE, available_date: new Date(mondayInWeekAfter) });
            return info
        }

        // cập nhật ngày availble
        const info = await this.registerRepository.update(id, { status: STATUS_REGISTER_ADVISE.APPROVE, available_date: new Date(mondayInWeekAfter) });

        return info
    }






}