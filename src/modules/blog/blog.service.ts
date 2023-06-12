import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PaginationTypeOrmResponseDto } from '../../shared/utils/pagination.utility';

import { Blog } from './entity/blog.entity';

import { BlogCreateDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { FilteredResponseDto } from '../../shared/dto/filtered-response.dto';
import { S3Service } from '../../s3/s3.service';
import { join } from 'path';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog) private readonly blogRepository: Repository<Blog>,
    private s3Service: S3Service,
    private readonly entityManager: EntityManager,
  ) {}

  public async createBlog(publisherId: string, dto: BlogCreateDto) {
    const blog = await this.blogRepository
      .createQueryBuilder('blog')
      .where('blog.publisherId = :publisherId', { publisherId })
      .andWhere('blog.name = :blogName', { blogName: dto.name })
      .getOne();

    if (blog) {
      const errMsg = `Can't create blog. Blog with alias: ${dto.name}, already exist`;
      throw new BadRequestException(errMsg);
    }

    try {
      const blogBody = { ...dto, publisher: { id: publisherId } };
      return await this.blogRepository.save(blogBody);
    } catch (e) {
      throw new InternalServerErrorException(`blog wasn't created. Error: ${e.message}`);
    }
  }

  public async getBlogByPublisherAndId(blogId: string, publisherId: string): Promise<Blog> {
    const blog = await this.blogRepository
      .createQueryBuilder('blog')
      .where('blog.publisherId = :publisherId', { publisherId })
      .andWhere('blog.id = :blogId', { blogId })
      .getOne();

    if (!blog) {
      throw new BadRequestException(`blog wasn't found or you're not owner`);
    }

    return blog;
  }

  public async getPaginatedBlogsList(
    query: PaginationTypeOrmResponseDto,
  ): Promise<FilteredResponseDto<Blog>> {
    const { take, skip } = query;

    try {
      const [rows, count] = await this.blogRepository.findAndCount({ take, skip });
      return {
        data: rows,
        total: count,
      };
    } catch (e) {
      throw new InternalServerErrorException(`Can't find blogs. Error: ${e.message}`);
    }
  }

  public async patchBlog(publisherId: string, body: UpdateBlogDto) {
    const blog = await this.getBlogByPublisherAndId(body.blogId, publisherId);

    try {
      blog.name = body.name ? body.name : blog.name;
      blog.description = body.description ? body.description : blog.description;

      return await this.blogRepository.save(blog);
    } catch (e) {
      throw new InternalServerErrorException(`Can't patch blog. Error: ${e.message}`);
    }
  }

  public async deleteBlogById(publisherId: string, blogId: string): Promise<void> {
    const blog = await this.getBlogByPublisherAndId(blogId, publisherId);

    try {
      await this.entityManager.transaction(async (transactionDbManager) => {
        await transactionDbManager.remove(blog);

        const folderPath = join(this.s3Service.getStoragePrefix(), publisherId, blog.id);
        const folderContent = await this.s3Service.listFolderContent(folderPath);
        await this.s3Service.deleteObjects(folderContent);
      });
    } catch (e) {
      throw new InternalServerErrorException(`Can't delete blog. Error: ${e.message}`);
    }
  }
}
