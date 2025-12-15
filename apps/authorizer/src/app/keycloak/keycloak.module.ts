import { Module } from "@nestjs/common";
import { KeycloakHttpService } from "./services/keycloak-http.service";

@Module({
    providers: [KeycloakHttpService],
    exports: [KeycloakHttpService]
})
export class KeycloakModule {

}