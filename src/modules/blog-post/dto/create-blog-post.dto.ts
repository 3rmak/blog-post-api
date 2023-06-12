import { Field, InputType } from '@nestjs/graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload';

import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateBlogPostDto {
  @IsUUID()
  @Field(() => String)
  public blogId: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  public title: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  public description: string;

  @Field(() => GraphQLUpload)
  public avatar: Promise<FileUpload>;
}
