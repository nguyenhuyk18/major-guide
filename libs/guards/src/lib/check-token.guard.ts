
import { Injectable, CanActivate, ExecutionContext, Inject, UnauthorizedException } from '@nestjs/common';
import { firstValueFrom, map, Observable } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { Reflector } from '@nestjs/core';
import { MetaDataKeys } from '@common/constant/common.constant';
import { getToken } from '@common/utils/common/get-token.util';
import { createHash } from 'crypto';
import { Cache } from 'cache-manager';
import { getProcessId } from '@common/utils/string.util';
import { AuthorizerResponse } from '@common/interfaces/gateway/authorizer/authorizer-request.interface';
import { TCP_AUTHORIZER_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';

@Injectable()
export class UserGuard implements CanActivate {

    constructor(
        private reflector: Reflector,
        @Inject(TCP_SERVICE.AUTHORIZER_SERVICE) private readonly authClient: TcpClient,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }


    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const isSecured = this.reflector.get(MetaDataKeys.SECURED, context.getHandler());
        const request = context.switchToHttp().getRequest();
        // console.log('sdfsdfsfsdfsdfsdf')
        // console.log(request.headers['authorization'])
        // console.log(isSecured)
        if (!isSecured) {
            return true
        }

        const token = getToken(request, false);
        // console.log(token)
        return this.verifyToken(token, request)
    }


    async verifyToken(token: string, request: any) {
        const keyRedis = this.generateTokenKey(token);
        // console.log('3546465uerytjrthjedrthe5rtyjrgthrtyjetytjmdtyje5yje56jn')
        const caching = await this.cacheManager.get(keyRedis);

        if (caching) {
            return true;
        }

        // get process Id 

        const processId = request[MetaDataKeys.PROCESS_ID] || getProcessId();
        const rs = await this.verifyUserToken(token, processId);

        if (!rs?.valid) {
            throw new UnauthorizedException('Bạn không có thẩm quyền để đi vào đây !!!')
        }

        const newHashKey: string = this.generateTokenKey(token);
        this.cacheManager.set(newHashKey, rs.metadata, 30 * 60 * 1000);

        return true;
    }

    async verifyUserToken(token: string, processId: string) {
        // get processId 
        const rs = await firstValueFrom(this.authClient.send<AuthorizerResponse, string>(TCP_AUTHORIZER_SERVICE_MESSAGE.VERIFY_USER, { processId, data: token }).pipe(map(row => row.data)))

        return rs;
    }


    // sinh ra cais key tu token
    generateTokenKey = (token: string): string => {
        const hash = createHash('sha256').update(token).digest('hex');
        return `user-token:${hash}`;
    }
}
