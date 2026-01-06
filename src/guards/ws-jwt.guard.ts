/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class WsJwtGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient();

    // Passport expects req.headers.authorization
    return {
      headers: {
        authorization: `Bearer ${client.handshake.auth?.token}`,
      },
    };
  }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }

        const client = context.switchToWs().getClient();
        client.data.user = user;

        return user;
    }

}
