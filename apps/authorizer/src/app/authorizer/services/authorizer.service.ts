import { Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { KeycloakHttpService } from "../../keycloak/services/keycloak-http.service";
import { CreateKeyCloakUserRequest } from "@common/interfaces/common/create-user-keyloak-request.interface";
import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { UserRequestTcp, UserResponseTcp } from '@common/interfaces/tcp/user';
import { firstValueFrom, map } from "rxjs";
import { LoginTcpRequest } from "@common/interfaces/tcp/authorizer";
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken';
import jwksRsa, { JwksClient } from 'jwks-rsa';

import { ConfigService } from "@nestjs/config";
import { AuthorizerResponse } from '@common/interfaces/gateway/authorizer';

@Injectable()
export class AuthorizerService {
    private readonly logger = new Logger(AuthorizerService.name);
    private jwksClient: JwksClient;

    // private userService: UserService;

    constructor(
        private readonly configService: ConfigService,
        private readonly keycloakService: KeycloakHttpService,
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly authorizerClient: TcpClient
    ) {
        this.jwksClient = jwksRsa({
            jwksUri: `${this.configService.get('KEYCLOAK_CONFIG.HOST')}/realms/${this.configService.get('KEYCLOAK_CONFIG.REALM')}/protocol/openid-connect/certs`,
            cache: true,
            rateLimit: true
        })
    }


    async loginUser(data: LoginTcpRequest) {
        const rs = await this.keycloakService.exchangeUserToken(data)
        return rs;
    }


    async createUser(data: CreateKeyCloakUserRequest, processId: string): Promise<UserResponseTcp> {
        const { email, firstname, lastname, username, ward_id } = data

        const userId = await this.keycloakService.createUser(data);

        // call tcp tới user-access để thêm thông tin vào
        const rs = await firstValueFrom(this.authorizerClient.send<UserResponseTcp, UserRequestTcp>(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_NEW_USER, { data: { email, firstname, lastname, username, ward_id, userId }, processId: processId }).pipe(map(row => row.data)))


        return rs;

    }


    async verifyUserToken(token: string, processid: string): Promise<AuthorizerResponse> {
        const decoded = jwt.decode(token, { complete: true }) as Jwt;
        // console.log(decoded, ' ', token)
        if (!decoded || !decoded.header || !decoded.header.kid) {
            throw new UnauthorizedException('Invalid token structure')
        }

        try {
            const key = await this.jwksClient.getSigningKey(decoded.header.kid);
            const publicKey = key.getPublicKey();
            const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
            this.logger.debug({ payload });


            const user = await this.validateGetUser(payload.sub, processid);
            return {
                valid: true,
                metadata: {
                    jwt: payload,
                    user: user,
                    userId: user.id
                }
            }
        } catch (error) {
            this.logger.error({ error });
            throw new UnauthorizedException('Invalid token 1')
        }
    }


    async validateGetUser(userId: string, processId: string) {
        const rs = await this.getUser(userId, processId);
        if (!rs) {
            throw new UnauthorizedException('Bạn không có thẩm quyền !!!')
        }
        return rs;
    }

    async getUser(userId: string, processId: string) {
        const rs = await firstValueFrom(this.authorizerClient.send<UserResponseTcp, { id_user: string, isKeycloak: boolean }>(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_USER_BY_ID, {
            processId, data: {
                id_user: userId,
                isKeycloak: true
            }
        }).pipe(map(row => row.data)))
        return rs;
    }

}