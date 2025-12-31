import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsProviderAsyncOptions, GrpcOptions, Transport } from "@nestjs/microservices";
import { IsNotEmpty, IsObject } from "class-validator";
import { join } from "path";

export enum GRPC_SERVICES {
    USER_ACCESS_SERVICE = 'GRPC_USER_ACCESS_SERVICE',
    AUTHORIZE_SERVICE = 'GRPC_AUTHORIZE_SERVICE'
}

export class GrpcConfiguration {
    @IsObject()
    @IsNotEmpty()
    GRPC_AUTHORIZE_SERVICE: GrpcOptions & { name: string };

    @IsObject()
    @IsNotEmpty()
    GRPC_USER_ACCESS_SERVICE: GrpcOptions & { name: string };


    constructor() {
        this.GRPC_AUTHORIZE_SERVICE = GrpcConfiguration.setValue({
            key: GRPC_SERVICES.AUTHORIZE_SERVICE,
            protoPath: ['./proto/authorizer.proto'],
            host: process.env['AUTHORIZER_SERVICE_HOST'] || 'localhost',
            port: Number(process.env[`${GRPC_SERVICES.AUTHORIZE_SERVICE}_PORT`]) || 5100
        })
        this.GRPC_USER_ACCESS_SERVICE = GrpcConfiguration.setValue({
            key: GRPC_SERVICES.USER_ACCESS_SERVICE,
            protoPath: ['./proto/useraccess.proto'],
            host: process.env['USER_ACCESS_SERVICE_HOST'] || 'localhost',
            port: Number(process.env[`${GRPC_SERVICES.USER_ACCESS_SERVICE}_PORT`]) || 5101
        })
    }

    private static setValue({
        key,
        protoPath,
        port = 5100,
        host = 'localhost',
    }: {
        key: GRPC_SERVICES;
        protoPath: string | string[];
        port?: number;
        host?: string;
    }): GrpcOptions & { name: string } {
        return {
            name: key,
            transport: Transport.GRPC,
            options: {
                package: key,
                protoPath: Array.isArray(protoPath)
                    ? protoPath.map((path) => join(__dirname, path))
                    : join(__dirname, protoPath),
                url: `${host}:${port}`,
            },
        };
    }
}


export function GrpcProvider(serviceName: GRPC_SERVICES): ClientsProviderAsyncOptions {
    return {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: serviceName,
        useFactory: async (configService: ConfigService) => {
            return configService.get(`GRPC_CONFIG.${serviceName}`) as GrpcOptions & { name: string }
        }
    }
}