import { registerEnumType } from '@nestjs/graphql';

export enum BlogPostDecisionEnum {
  PUBLISH = 'PUBLISH',
  REJECT = 'REJECT',
}

registerEnumType(BlogPostDecisionEnum, {
  name: 'BlogPostDecisionEnum',
});
