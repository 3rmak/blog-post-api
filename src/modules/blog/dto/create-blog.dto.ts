import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class BlogCreateDto {
  @IsString()
  @Field(() => String)
  public name: string;

  @IsString()
  @Field(() => String)
  public description: string;
}
