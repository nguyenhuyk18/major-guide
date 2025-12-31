import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { UserRepository } from '../repositories/user.repository';
import { UpdateAvatarRequestTcp, UserRequestTcp } from "@common/interfaces/tcp/user";
import { mapperCreateUser } from "../mapper";
import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { TCP_MEDIA_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { firstValueFrom, map } from "rxjs";
import { User } from "@common/schemas/user-access/user.schema";



@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository,
        @Inject(TCP_SERVICE.MEDIA_SERVICE) private readonly mediaClient: TcpClient
    ) { }

    async createUser(data: UserRequestTcp, processId: string) {

        if (await this.userRepository.isExistEmail(data.email)) {
            throw new BadRequestException('Email này đã tồn tại')
        }

        // call to media service 
        // const file_url = await firstValueFrom(this.mediaClient.send<string, { buff: string, filename: string }>(TCP_MEDIA_SERVICE_MESSAGE.UPLOAD_AVARTAR_USER, { processId, data: { buff: data.buff, filename: data.fileName } }).pipe(map(row => row.data)))


        const newData = mapperCreateUser(data);


        return this.userRepository.create(newData);
    }

    getByIdUser(userId: string) {
        return this.userRepository.getByUserId(userId);
    }




    getById(id: string) {
        return this.userRepository.getById(id);
    }


    async getByIds(id: string[]) {
        // console.log(id)
        const rs = await this.userRepository.getByIds(id);
        // console.log('chocho')
        // console.log(rs);
        const mapRs = new Map<string, User>()

        rs.forEach(row => {
            mapRs.set(row.id, row);
        })
        const resultObj = Object.fromEntries(mapRs);
        return resultObj;
    }



    async updateAvatar(data: UpdateAvatarRequestTcp, processId) {
        const fileurl = await firstValueFrom(this.mediaClient.send<string, { buff: string, filename: string }>(TCP_MEDIA_SERVICE_MESSAGE.UPLOAD_AVARTAR_USER, {
            processId, data:
            {
                buff: data.buffer,
                filename: data.fileName
            }
        }).pipe(map(row => row.data)))

        return this.userRepository.updateUserById(data.id_user, { fileAvartarUrl: fileurl })

    }


}