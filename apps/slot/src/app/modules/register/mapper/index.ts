import { RegisterRequestDto } from "@common/interfaces/gateway/register/register-request.interface";
import { Register, ShiftInCharge } from "@common/schemas/slot/register.schema";
import { ObjectId } from 'mongodb'

export const mapperRegister = (data: RegisterRequestDto): Partial<Register> => {
    return {
        day: data.day.map(row => {
            return {
                day: row.day,
                shift_id: new ObjectId(row.shift_id)
            } as ShiftInCharge
        }),
        id_expert: data.id_expert
    }
}