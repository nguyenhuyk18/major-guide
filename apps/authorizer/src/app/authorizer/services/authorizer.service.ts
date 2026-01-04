import { ForbiddenException, Inject, Injectable, Logger, OnModuleInit, UnauthorizedException } from "@nestjs/common";
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
import { UserAccessService } from '@common/interfaces/grpc/user-access';
import { ClientGrpc } from "@nestjs/microservices";
import { ObjectId } from "mongodb";
import { GRPC_SERVICES } from "@common/configuration/grpc.config";
import { ExchangeUserTokenResponse } from "@common/interfaces/common/exchange-token-user-password.interface";
import { User } from "@common/schemas/user-access/user.schema";
import { ROLE } from "@common/constant/enum/action.constant";

@Injectable()
export class AuthorizerService implements OnModuleInit {
    private readonly logger = new Logger(AuthorizerService.name);
    private jwksClient: JwksClient;
    private userAccessService: UserAccessService

    // private userService: UserService;


    constructor(
        private readonly configService: ConfigService,
        private readonly keycloakService: KeycloakHttpService,
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly authorizerClient: TcpClient,
        @Inject(GRPC_SERVICES.USER_ACCESS_SERVICE) private client: ClientGrpc
    ) {
        this.jwksClient = jwksRsa({
            jwksUri: `${this.configService.get('KEYCLOAK_CONFIG.HOST')}/realms/${this.configService.get('KEYCLOAK_CONFIG.REALM')}/protocol/openid-connect/certs`,
            cache: true,
            rateLimit: true
        })
    }

    onModuleInit() {
        this.userAccessService = this.client.getService<UserAccessService>('UserAccessService');
    }

    async loginUser(data: LoginTcpRequest) {
        // console.log('1234')
        const rs = await this.keycloakService.exchangeUserToken(data);
        // console.log('1234')
        const accessToken = rs.access_token;
        const decoded = jwt.decode(accessToken, { complete: true }) as Jwt;
        // console.log('1234')
        // console.log(decoded.payload.sub);

        // call grpc để lấy role tại đây
        const userInfo = await firstValueFrom(this.userAccessService.findUserById({ idUser: String(decoded.payload.sub), isKeycloak: true }))
        // console.log(userInfo);

        if (data.isAdminSite == true && userInfo.roleName === 'member') {
            throw new ForbiddenException('Bạn không có quyền đăng nhập vào hệ thống admin , vui lòng thoát ra ngay trước khi lãnh hậu quả !!!')
        }
        else if (data.isAdminSite == false && userInfo.roleName !== 'member') {
            throw new ForbiddenException('Đây không phải là nơi bạn thuộc về , Badbye =(((( ')
        }
        // console.log('1234')
        return {
            ...rs,
            fileAvartarUrl: userInfo.fileAvartarUrl,
            name: userInfo.name,
            roleName: userInfo.roleName,
            email: userInfo.email
        } as ExchangeUserTokenResponse & Partial<User>;
    }


    async createUser(data: CreateKeyCloakUserRequest, processId: string): Promise<UserResponseTcp> {
        const { email, firstname, lastname, username, ward_id, isExpert, role_name, expertProfile, memberProfile } = data

        const user_id = await this.keycloakService.createUser(data);

        // call tcp tới user-access để thêm thông tin vào
        const rs = await firstValueFrom(this.authorizerClient.send<UserResponseTcp, UserRequestTcp>(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_NEW_USER, { data: { email, firstname, lastname, username, ward_id, user_id, role_name: role_name, memberProfile, expertProfile, isExpert }, processId: processId }).pipe(map(row => row.data)))


        return rs;

    }


    async verifyUserToken(token: string, processid: string): Promise<AuthorizerResponse> {
        const decoded = jwt.decode(token, { complete: true }) as Jwt;
        if (!decoded || !decoded.header || !decoded.header.kid) {
            throw new UnauthorizedException('Invalid token structure')
        }

        try {
            const key = await this.jwksClient.getSigningKey(decoded.header.kid);
            const publicKey = key.getPublicKey();
            const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
            this.logger.debug({ payload });


            const user = await this.validateGetUser(payload.sub, processid);

            // console.log(user)
            return {
                valid: true,
                metadata: {
                    jwt: payload,
                    user: {
                        id: user.id,
                        email: user.email,
                        fileAvartarUrl: user.fileAvartarUrl,
                        name: user.name,
                        roleName: user.roleName,
                        wardId: new ObjectId(user.wardId)
                    },
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


    // ========================================= //
    async getUser(userId: string, processId: string) {
        console.log(processId);
        const rs = await firstValueFrom(this.userAccessService.findUserById({ idUser: userId, isKeycloak: true }))
        // console.log(rs);
        return rs;
    }

}