import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const RequestUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const gqlCtx = GqlExecutionContext.create(ctx);
  const request = gqlCtx.getContext().getRequest();

  return request.user;
});
