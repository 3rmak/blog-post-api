import { FileUpload } from 'graphql-upload';
import { InternalServerErrorException } from '@nestjs/common';

export class FileReadUtility {
  public async getFileBuffer(file: FileUpload): Promise<string> {
    try {
      const { createReadStream } = file;

      const stream = createReadStream();
      const chunks = [];

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        let buffer: Buffer;

        stream.on('data', function (chunk) {
          chunks.push(chunk);
        });

        stream.on('end', function () {
          buffer = Buffer.concat(chunks);
          resolve(buffer);
        });

        stream.on('error', reject);
      });

      return buffer.toString('base64');
    } catch (e) {
      throw new InternalServerErrorException(`File reading error: ${e.message}`);
    }
  }
}
