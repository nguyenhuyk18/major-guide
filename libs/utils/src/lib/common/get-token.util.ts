import { parseToken } from "../string.util";
import { User } from '@common/schemas/user-access/user.schema';
import { MetaDataKeys } from '../../../../constant/src/lib/common.constant';

export const getToken = (req: any, keepBearer: boolean) => {
    const token: string = req.headers['authorization'] || '';
    // console.log(token)
    return keepBearer ? token : parseToken(token);
}

export const grantUserToRequest = (req: any, user: User) => {
    req[MetaDataKeys.USER_INFO] = user;
}