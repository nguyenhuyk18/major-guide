import { Observable } from 'rxjs';
import { User } from '@common/schemas/user-access/user.schema';
import { ResponseTcp } from '../../tcp/common/response-tcp.interface';



export interface UserAccessService {
    findUserById(tmp: { idUser: string, isKeycloak: boolean }): Observable<Partial<User>>
}