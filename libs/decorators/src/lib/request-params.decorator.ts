import { createParamDecorator, ExecutionContext } from '@nestjs/common'
// import { MetaDataKeys } from '@common/constants/common.constant'


export const RequestParams = createParamDecorator(
    (param: string, ctx: ExecutionContext) => {
        const request = ctx.switchToRpc().getData();

        if (!param) {
            return request.data;
        }

        return request.data[param];
    },
);





