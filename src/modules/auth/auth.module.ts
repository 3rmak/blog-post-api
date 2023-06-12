import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UserModule } from '../user/user.module';

import { AuthResolver } from './auth.resolver';

import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: configService.get<string>('TOKEN_EXPIRES') },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, AuthResolver],
  exports: [JwtModule],
})
export class AuthModule {}
