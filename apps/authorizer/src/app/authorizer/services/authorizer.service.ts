import { Inject, Injectable } from "@nestjs/common";
import { KeycloakHttpService } from "../../keycloak/services/keycloak-http.service";
import { CreateKeyCloakUserRequest } from "@common/interfaces/common/create-user-keyloak-request.interface";
import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';

@Injectable()
export class AuthorizerService {
    constructor(
        private readonly keycloakService: KeycloakHttpService,
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly authorizerClient: TcpClient
    ) { }


    async createUser(data: CreateKeyCloakUserRequest) {
        const rs = await this.keycloakService.createUser(data);


    }

}