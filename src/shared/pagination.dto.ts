import { ArgsType, Field } from '@nestjs/graphql';
import { IsPositive, IsOptional } from 'class-validator';

@ArgsType()
export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Field({ nullable: true })
  public page?: number;

  @IsOptional()
  @IsPositive()
  @Field({ nullable: true })
  public per_page?: number;
}
