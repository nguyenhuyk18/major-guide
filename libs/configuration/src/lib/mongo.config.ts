import { Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Connection } from "mongoose";

export class MongoConfiguration {

    @IsString()
    @IsNotEmpty()
    URL: string;

    @IsString()
    @IsNotEmpty()
    DB_NAME: string;

    @IsNumber()
    @IsOptional()
    POOL_SIZE?: number;

    @IsNumber()
    @IsOptional()
    CONNECTION_TIMEOUT_MS?: number;

    @IsNumber()
    @IsOptional()
    SOCKET_TIMEOUT_MS?: number;

    constructor(data?: Partial<MongoConfiguration>) {
        console.log(data?.DB_NAME)
        // Object.assign(this, data);
        this.URL = data?.URL || process.env['MONGODB_URI'] || '';
        this.DB_NAME = data?.DB_NAME || 'TEST';
        this.POOL_SIZE = data?.POOL_SIZE || Number(process.env['MONGODB_POOL_SIZE']) || 10;
        this.SOCKET_TIMEOUT_MS = data?.SOCKET_TIMEOUT_MS || Number(process.env['MONGODB_SOCKET_TIMEOUT_MS']) || 15000;
        this.CONNECTION_TIMEOUT_MS = data?.CONNECTION_TIMEOUT_MS || Number(process.env['MONGODB_CONNECTION_TIMEOUT_MS']) || 360000
    }
}

export const MongoProvider = MongooseModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],

    useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGO_CONFIG.URL'),
        dbName: configService.get('MONGO_CONFIG.DB_NAME'),
        maxPoolSize: configService.get('MONGO_CONFIG.POOL_SIZE'),
        connectTimeoutMS: configService.get('MONGO_CONFIG.CONNECTION_TIMEOUT_MS'),
        socketTimeoutMS: configService.get('MONGO_CONFIG.SOCKET_TIMEOUT_MS'),

        onConnectionCreate: (connection: Connection) => {
            connection.on('connected', () => Logger.log(' 🟢   🟢   🟢   >>  connected'));
            connection.on('open', () => Logger.log(' 🟢   🟢   🟢   >>  open'));
            connection.on('disconnected', () => Logger.log(' 🪓   🪓   🪓   >>  disconnected'));
            connection.on('reconnected', () => Logger.log(' 🧡   🧡   🧡   >>  reconnected'));
            connection.on('disconnecting', () => Logger.log(' 🪓   🪓   🪓   >>  disconnecting'));
            return connection;
        }
    })
})