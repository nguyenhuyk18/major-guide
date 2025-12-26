import { Register } from '@common/schemas/slot/register.schema';
import { User } from '@common/schemas/user-access/user.schema';
export type RegisterTcpResponse = Register


export class RegisterTcpWithUserResponse {
    user: User;
    register: Register;
}