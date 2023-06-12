import { Field, ObjectType } from '@nestjs/graphql';
import { Blog } from '../entity/blog.entity';

@ObjectType()
export class PaginatedBlogResponseDto {
  @Field()
  page: number;

  @Field()
  perPage: number;

  @Field()
  total: number;

  @Field()
  totalPages: number;

  @Field(() => [Blog])
  data: Array<Blog>;
}
