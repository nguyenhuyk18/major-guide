import { Observable } from 'rxjs';
// import { User } from '@common/schemas/user-access/user.schema';
// import { ResponseTcp } from '../../tcp/common/response-tcp.interface';
import { ROLE } from '@common/constant/enum/action.constant';
import { User } from '@common/schemas/user-access/user.schema';



export interface UserAccessService {
    findUserById(tmp: { idUser: string, isKeycloak: boolean }): Observable<Partial<User>>
}