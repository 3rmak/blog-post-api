import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';

import { Observable } from 'rxjs';

@Injectable()
export class JwtResolveGuard implements CanActivate {
  private readonly user = { id: null, email: null, role: [] };
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    try {
      const authHeader = req.headers.authorization;
      const bearer = authHeader?.split(' ')[0];
      const token = authHeader?.split(' ')[1];

      if (!authHeader || bearer !== 'Bearer' || !token) {
        req.user = this.user;
        return true;
      }

      req.user = this.jwtService.verify(token);
      return true;
    } catch (e) {
      throw new UnauthorizedException({ message: 'User is not authorized' });
    }
  }
}
