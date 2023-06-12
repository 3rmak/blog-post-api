import { createUnionType, Field, ObjectType } from '@nestjs/graphql';
import { FilteredResponseDto } from './filtered-response.dto';

import { BlogPost } from '../../modules/blog-post/entity/blog-post.entity';
import { Blog } from '../../modules/blog/entity/blog.entity';
import { User } from '../../modules/user/entity/user.entity';

export const ResultUnion = createUnionType({
  name: 'ResultUnion',
  types: () => [User, Blog, BlogPost] as const,
});

@ObjectType()
export class PaginatedResponseDto<T> implements FilteredResponseDto<T> {
  @Field()
  page: number;

  @Field()
  perPage: number;

  @Field()
  total: number;

  @Field()
  totalPages: number;

  @Field(() => [ResultUnion])
  data: Array<T>;
}
