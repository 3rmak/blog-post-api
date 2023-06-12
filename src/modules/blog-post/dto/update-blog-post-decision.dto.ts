import { IsEnum, IsUUID } from 'class-validator';

import { BlogPostDecisionEnum } from '../entity/blog-post-decision.enum';
import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateBlogPostDecisionDto {
  @IsUUID()
  @Field(() => ID)
  public blogPostId: string;

  @IsEnum(BlogPostDecisionEnum)
  @Field(() => BlogPostDecisionEnum)
  decision: BlogPostDecisionEnum;
}
