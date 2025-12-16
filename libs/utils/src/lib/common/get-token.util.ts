import { parseToken } from "../string.util";

export const getToken = (req: any, keepBearer: boolean) => {
    const token: string = req.headers['authorization'] || '';
    // console.log(token)
    return keepBearer ? token : parseToken(token);
}