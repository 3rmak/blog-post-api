import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthResponseDto } from './dto/auth.response.dto';

@Resolver(() => AuthResponseDto)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponseDto, { name: 'login' })
  public async login(@Args('authLoginInput') body: AuthLoginDto): Promise<AuthResponseDto> {
    console.log('login request here');
    return this.authService.login(body);
  }
}
