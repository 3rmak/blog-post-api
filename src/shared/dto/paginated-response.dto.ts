import { FilteredResponseDto } from './filtered-response.dto';
import { Field, ObjectType } from '@nestjs/graphql';
import { Entity } from 'typeorm';

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

  @Field(() => [Entity])
  data: T[];
}
