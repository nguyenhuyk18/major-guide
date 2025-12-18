
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@common/schemas/user-access/user.schema';
import { MetaDataKeys } from '@common/constant/common.constant';

export const UserInfo = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const rs: User = request[MetaDataKeys.USER_INFO]
        return rs ? rs : null;
    },
);