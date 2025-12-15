import { Injectable } from "@nestjs/common";
import { RegisterRepository } from "../repository/register.repository";
import { Register } from "@common/schemas/slot/register.schema";
import { RegisterTcpRequest } from "@common/interfaces/tcp/register";
import { mapperRegister } from "../mapper";


@Injectable()
export class RegisterService {
    constructor(private readonly registerRepository: RegisterRepository) { }


    create(data: Partial<RegisterTcpRequest>) {
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