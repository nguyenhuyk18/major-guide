
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RpcException } from '@nestjs/microservices';
import { HTTP_MESSAGE } from '@common/constant/enum/http-message.constant';

@Injectable()
export class TcpLoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const handler = context.getHandler();

        const handlerName = handler.name; // trả về tên của cái function

        const args = context.getArgs();
        // console.log(args)
        const param = args[0];
        const processId = param.processId;


        Logger.log(`TCP >> Start Process '${processId}' >> method: '${handlerName}' at '${now}' >> input: ${JSON.stringify(param)} `);

        return next.handle().pipe(
            tap(() => Logger.log(`TCP >> End Process '${processId}' >> method: '${handlerName}' after: '${Date.now() - now}ms'`)),
            catchError((error) => {
                const duration = Date.now() - now;
                Logger.error(
                    `TCP » Error process '${processId}': ${error.message} >> data: ${JSON.stringify(
                        error,
                    )}, after: '${duration}ms'`,
                );

                throw new RpcException({
                    code: error.status || error.code || error.error?.code || HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error?.response?.message || error?.message || HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
                });
            })
        )
    }
}
