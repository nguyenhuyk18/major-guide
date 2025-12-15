import { UserRequestTcp } from "@common/interfaces/tcp/user";
import { User } from "@common/schemas/user-access/user.schema";
import { ObjectId } from 'mongodb';

export const mapperCreateUser = (data: UserRequestTcp): Partial<User> => {
    return {
        username: data.username,
        name: data.firstname + ' ' + data.lastname,
        email: data.email,
        ward_id: new ObjectId(data.ward_id),
        fileAvartarUrl: 'https://res.cloudinary.com/dszzlhs5i/image/upload/v1765722730/avatar-mac-dinh-4-2_x3xl1f.jpg'
    }
}