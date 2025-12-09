import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsProviderAsyncOptions, TcpClientOptions, Transport } from '@nestjs/microservices'
import { IsNotEmpty, IsObject } from 'class-validator';

export enum TCP_SERVICE {
    SLOT_SERVICE = 'TCP_SLOT_SERVICE',

}

export class TcpConfiguration {
    @IsNotEmpty()
    @IsObject()
    TCP_SLOT_SERVICE: TcpClientOptions;

    constructor() {
        Object.entries(TCP_SERVICE).forEach(([key, serviceName]) => {
            const host = process.env[`${key}_HOST`] || 'localhost';
            const port = Number(process.env[`${serviceName}_PORT`]);
            this[serviceName] = TcpConfiguration.setValue(port, host)
        })
    }

    static setValue(port: number, host: string): TcpClientOptions {
        return {
            transport: Transport.TCP,
            options: {
                host,
                port
            }
        }
    }
}

export function TcpProvider(serviceName: keyof TcpConfiguration): ClientsProviderAsyncOptions {
    return {
        name: serviceName,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
            return configService.get(`TCP_SERV.${serviceName}`) as TcpClientOptions;
        }
    }
}
