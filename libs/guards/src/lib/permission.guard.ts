
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Roles } from '@common/decorators/role.decorator';
import { MetaDataKeys } from '@common/constant/common.constant';
import { User } from '@common/schemas/user-access/user.schema';

@Injectable()
export class PermissionGuard implements CanActivate {


    constructor(private reflector: Reflector) { }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();

        const roles = this.reflector.get(Roles, context.getHandler());

        if (!roles) {
            // console.log('Chưa check role nhé')
            return true;
        }

        const user: User = request[MetaDataKeys.USER_INFO];

        const kq = roles.includes(user.role_name)

        return kq;
    }
}
