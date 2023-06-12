import { Field, ID, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class UpdateBlogPostDto {
  @IsUUID()
  @Field(() => ID)
  public blogPostId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: true })
  public title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: true })
  public description?: string;
}
