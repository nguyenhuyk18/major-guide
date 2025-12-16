import { AvartarDefault } from "@common/constant/common.constant";
import { UserRequestTcp } from "@common/interfaces/tcp/user";
import { User } from "@common/schemas/user-access/user.schema";
import { ObjectId } from 'mongodb';

export const mapperCreateUser = (data: UserRequestTcp): Partial<User> => {
    return {
        username: data.username,
        name: data.firstname + ' ' + data.lastname,
        email: data.email,
        ward_id: new ObjectId(data.ward_id),
        fileAvartarUrl: AvartarDefault.AVARTAR_DEFAULT,
        userId: data.userId
    }
}