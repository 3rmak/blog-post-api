import { Field, ObjectType } from '@nestjs/graphql';

import { BlogPost } from '../entity/blog-post.entity';

@ObjectType()
export class PaginatedBlogPostResponseDto {
  @Field()
  page: number;

  @Field()
  perPage: number;

  @Field()
  total: number;

  @Field()
  totalPages: number;

  @Field(() => [BlogPost])
  data: Array<BlogPost>;
}
