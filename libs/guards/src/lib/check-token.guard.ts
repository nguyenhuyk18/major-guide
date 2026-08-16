
import { Injectable, CanActivate, ExecutionContext, Inject, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { firstValueFrom, map, Observable } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { Reflector } from '@nestjs/core';
import { MetaDataKeys } from '@common/constant/common.constant';
import { getToken, grantUserToRequest } from '@common/utils/common/get-token.util';
import { createHash } from 'crypto';
import { Cache } from 'cache-manager';
import { getProcessId } from '@common/utils/string.util';
import { MetaDataOfAuThorizer } from '@common/interfaces/gateway/authorizer/authorizer-request.interface';
// import { TCP_AUTHORIZER_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';

import { AuthorizerService } from '@common/interfaces/grpc/authorizer';
import { GRPC_SERVICES } from '../../../configuration/src/lib/grpc.config';
import { ClientGrpc } from '@nestjs/microservices';

@Injectable()
export class UserGuard implements CanActivate, OnModuleInit {

    private authorizerService: AuthorizerService;



    constructor(
        private reflector: Reflector,
        @Inject(TCP_SERVICE.AUTHORIZER_SERVICE) private readonly authClient: TcpClient,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @Inject(GRPC_SERVICES.AUTHORIZE_SERVICE) private authorizeClient: ClientGrpc
    ) { }

    onModuleInit() {
        // cái ở trong dấu nháy là lấy từ tên service của file proto 
        // còn cái chỗ generic là lấy cái authoriz trong interface
        this.authorizerService = this.authorizeClient.getService<AuthorizerService>('AuthorizerService');
    }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        // Authorization can be declared on either a route handler or the whole
        // controller. Reading only the handler made class-level secured routes
        // execute without a user being attached to the request.
        const isSecured = this.reflector.getAllAndOverride<{ secured?: boolean }>(
            MetaDataKeys.SECURED,
            [context.getHandler(), context.getClass()],
        );
        const request = context.switchToHttp().getRequest();

        // console.log()

        if (!isSecured) {
            return true
        }

        if (!isSecured.secured) {
            return true;
        }

        const token = getToken(request, false);
        return this.verifyToken(token, request)
    }


    async verifyToken(token: string, request: any) {
        try {
            const keyRedis = this.generateTokenKey(token);

            const caching: MetaDataOfAuThorizer | undefined = await this.cacheManager.get(keyRedis);


            if (caching) {
                grantUserToRequest(request, caching.user)
                return true;
            }

            // get process Id 

            const processId = request[MetaDataKeys.PROCESS_ID] || getProcessId();
            const rs = await this.verifyUserToken(token, processId);

            if (!rs?.valid) {
                throw new UnauthorizedException('Bạn không có thẩm quyền để đi vào đây !!!')
            }


            // console.log(rs.metadata, 'dfsdfsdfsdfsdfsdf')

            const newHashKey: string = this.generateTokenKey(token);
            this.cacheManager.set(newHashKey, rs.metadata, 30 * 60 * 1000);
            grantUserToRequest(request, rs.metadata.user)

            return true;
        } catch (error) {
            console.log(error);
            throw new UnauthorizedException('Bạn không có thẩm quyền để đi vào đây !!!')
        }

    }

    async verifyUserToken(token: string, processId: string) {
        // get processId 
        const rs = await firstValueFrom(this.authorizerService.verifyUserToken({ token, processId }))
        // console.log(rs);
        return rs;
    }


    // sinh ra cais key tu token
    generateTokenKey = (token: string): string => {
        const hash = createHash('sha256').update(token).digest('hex');
        return `user-token:${hash}`;
    }
}
