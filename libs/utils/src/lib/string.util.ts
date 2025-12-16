import { v4 } from 'uuid'
import { UnauthorizedException } from '@nestjs/common';


export const getProcessId = (prefix?: string) => {
    return prefix ? `${prefix}-${v4()}` : v4();
}

export const parseToken = (token?: string) => {
    if (!token) {
        throw new UnauthorizedException('Không có ủy quyền');
    }

    if (token.includes(' ')) {
        return token.split(' ')[1];
    }

    return token;
}