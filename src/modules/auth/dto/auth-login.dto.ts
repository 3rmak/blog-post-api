import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

@InputType()
export class AuthLoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'email address is not valid' })
  @Field()
  public email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 64, { message: 'password must be in range 8 to 64' })
  @Field()
  public password: string;
}
