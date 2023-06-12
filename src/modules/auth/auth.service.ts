import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { User } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthResponseDto } from './dto/auth.response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly jwtService: JwtService) {}

  public async login(body: AuthLoginDto): Promise<AuthResponseDto> {
    let user = await this.userService.getUserByEmail(body.email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    user = await this.userService.getUserById(user.id);
    console.log('user', JSON.stringify(user));
    const token = await this.generateToken(user);
    return new AuthResponseDto(user, token);
  }

  public async generateToken(user: User): Promise<string> {
    const { id, email, role } = user;
    return this.jwtService.sign({ id, email, role: role.value });
  }
}
