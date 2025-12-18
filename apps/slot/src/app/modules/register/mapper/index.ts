import { RegisterRequestDto } from "@common/interfaces/gateway/register/register-request.interface";
import { Register } from "@common/schemas/slot/register.schema";
import { ObjectId } from 'mongodb'

export const mapperRegister = (data: RegisterRequestDto): Partial<Register> => {
    return {
        day: data.day.map(row => new ObjectId(row)),
        id_expert: data.id_expert
    }
}