import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

import { join, extname } from 'path';
import { _Object } from '@aws-sdk/client-s3/dist-types/models/models_0';
import { FileUpload } from 'graphql-upload';
import { FileReadUtility } from '../shared/utils/file-read.utility';

import { S3UploadImageDto } from './dto/s3-upload-image.dto';

@Injectable()
export class S3Service {
  private readonly bucketname: string;
  private readonly storagePrefix: string;
  private readonly fileUtility: FileReadUtility;

  constructor(
    @Inject('S3_PROVIDER') private s3Client: S3Client,
    private configService: ConfigService,
  ) {
    this.bucketname = configService.get('S3_BUCKET_NAME');
    this.storagePrefix = configService.get('S3_STORAGE_PREFIX');
    this.fileUtility = new FileReadUtility();
  }

  public getStoragePrefix(): string {
    return this.storagePrefix;
  }

  public async uploadImage(image: FileUpload, dto: S3UploadImageDto): Promise<string> {
    const fileBuffer = await this.fileUtility.getFileBuffer(image);
    const imageKey = this.pathConstructor(image.filename, dto);
    const command = new PutObjectCommand({
      Bucket: this.bucketname,
      Key: imageKey,
      Body: fileBuffer,
      CacheControl: 'max-age=63072000',
    });

    try {
      await this.s3Client.send(command);
      return this.getS3ImageUrl(imageKey);
    } catch (e) {
      throw new InternalServerErrorException(
        `error while uploading image to s3 bucket ${e.message}`,
      );
    }
  }

  public async deleteImageByUrl(imageUrl: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketname,
        Key: this.getS3ImageKeyByUrl(imageUrl),
      });

      await this.s3Client.send(deleteCommand);
    } catch (e) {
      throw new InternalServerErrorException(`Unable to delete image. Error: ${e.message}`);
    }
  }

  public async listFolderContent(folderKey: string): Promise<_Object[]> {
    const lsCommand = new ListObjectsV2Command({
      Bucket: this.bucketname,
      Prefix: this.getS3ImageUrl(folderKey),
    });

    try {
      const response = await this.s3Client.send(lsCommand);
      return response?.Contents;
    } catch (e) {
      const msgError = `Can't retrieve folder content from s3. Error: ${e.message}`;
      throw new InternalServerErrorException(msgError);
    }
  }

  public async deleteObjects(bucketObjects: _Object[]): Promise<void> {
    const Objects = bucketObjects.map(({ Key }) => ({ Key }));
    const deleteParams = new DeleteObjectsCommand({
      Bucket: this.bucketname,
      Delete: { Objects },
    });

    try {
      await this.s3Client.send(deleteParams);
    } catch (e) {
      const msgError = `Can't delete objects from s3. Error: ${e.message}`;
      throw new InternalServerErrorException(msgError);
    }
  }

  private getS3ImageUrl(key: string): string {
    return `https://${this.bucketname}.s3.amazonaws.com/${key}`;
  }

  private getS3ImageKeyByUrl(url: string): string {
    return url.split(`https://${this.bucketname}.s3.amazonaws.com/`)[1];
  }

  private pathConstructor(originalname: string, dto: S3UploadImageDto): string {
    const extName = extname(originalname);
    return join(this.storagePrefix, dto.publisherId, dto.blogId, dto.postId + extName);
  }
}
