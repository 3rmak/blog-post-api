import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

@InputType()
export class BlogCreateDto {
  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  public name: string;

  @IsOptional()
  @IsString()
  @Field(() => String)
  public description: string;
}
