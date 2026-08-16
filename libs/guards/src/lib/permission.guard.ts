
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

        // Support @Roles on both methods and controller classes.
        const roles = this.reflector.getAllAndOverride(Roles, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!roles) {
            return true;
        }

        const user: Partial<User> = request[MetaDataKeys.USER_INFO];

        if (!user?.roleName) {
            return false;
        }

        const kq = roles.includes(user.roleName)

        return kq;
    }
}
