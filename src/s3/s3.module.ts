import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { S3Client } from '@aws-sdk/client-s3';

import { S3Service } from './s3.service';

@Global()
@Module({})
export class S3Module {
  public static registerAsync(): DynamicModule {
    const s3Provider: Provider = {
      inject: [ConfigService],
      provide: 'S3_PROVIDER',
      useFactory: async (configService: ConfigService) => {
        const s3Client = new S3Client({
          region: configService.get('S3_BUCKET_REGION'),
          credentials: {
            accessKeyId: configService.get('S3_BUCKET_ACCESS_KEY'),
            secretAccessKey: configService.get('S3_BUCKET_SECRET_ACCESS_KEY'),
          },
        });

        return s3Client;
      },
    };

    return {
      module: S3Module,
      imports: [],
      controllers: [],
      providers: [S3Service, s3Provider],
      exports: [S3Service, s3Provider],
    };
  }
}
