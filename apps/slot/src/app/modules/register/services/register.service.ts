import { BadRequestException, Injectable } from "@nestjs/common";
import { RegisterRepository } from "../repository/register.repository";
import { Register } from "@common/schemas/slot/register.schema";
import { RegisterTcpRequest } from "@common/interfaces/tcp/register";
import { mapperRegister } from "../mapper";
import { RpcException } from "@nestjs/microservices";


@Injectable()
export class RegisterService {
    constructor(private readonly registerRepository: RegisterRepository) { }


    async create(data: Partial<RegisterTcpRequest>) {

        // check
        const check = await this.registerRepository.isExistIdExpert(data.id_expert);
        console.log(check)
        if (!check) {
            throw new BadRequestException('Bạn đã đăng ký lịch , không thể tiếp tục đăng ký thêm !!!')
        }

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

    getById(id: string) {
        return this.registerRepository.getById(id);
    }

    getByIdExpert(id_expert: string) {
        return this.registerRepository.getByIdExpert(id_expert);
    }



}