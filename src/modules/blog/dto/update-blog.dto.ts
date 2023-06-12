import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class UpdateBlogDto {
  @IsUUID()
  @Field(() => ID)
  public blogId: string;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  public name?: string;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  public description?: string;
}
