import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

import { ROLES_KEY } from './role-auth.decorator';

@Injectable()
export class GqlRolesGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    try {
      const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);

      if (!requiredRoles) {
        return true;
      }
      console.log('req.headers', req.headers);

      const authHeader = req.headers.authorization;
      if (!authHeader) throw new ForbiddenException(`Bearer token is required`);

      const [bearer, token] = authHeader.split(' ');

      if (bearer !== 'Bearer' || !token) {
        throw new ForbiddenException({ message: 'User is not authorized' });
      }

      try {
        req.user = this.jwtService.verify(token);
      } catch (e) {
        throw new ForbiddenException({ message: 'Invalid token' });
      }

      console.log('req.user', req.user);
      console.log('req.user.role', req.user.role);
      return requiredRoles.includes(req.user.role);
    } catch (e) {
      throw e;
    }
  }
}
