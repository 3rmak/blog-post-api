import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { BlogService } from '../blog/blog.service';
import { UserService } from '../user/user.service';
import { S3Service } from '../../s3/s3.service';
import { PaginationTypeOrmResponseDto } from '../../shared/utils/pagination.utility';

import { BlogPost } from './entity/blog-post.entity';

import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { FilteredResponseDto } from '../../shared/dto/filtered-response.dto';
import { BlogPostStatusEnum } from './entity/blog-post-status.enum';
import { UpdateBlogPostDecisionDto } from './dto/update-blog-post-decision.dto';
import { BlogPostDecisionEnum } from './entity/blog-post-decision.enum';
import { RolesEnum } from '../role/entity/roles.enum';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class BlogPostService {
  constructor(
    @InjectRepository(BlogPost) private blogPostRepository: Repository<BlogPost>,
    private blogService: BlogService,
    private userService: UserService,
    private s3Service: S3Service,
    private readonly entityManager: EntityManager,
  ) {}

  public async createBlogPost(
    publisherId: string,
    uploadImage: Express.Multer.File,
    body: CreateBlogPostDto,
  ): Promise<BlogPost> {
    const { blogId } = body;

    // check if blog exist and belongs to publisherId
    await this.blogService.getBlogByPublisherAndId(blogId, publisherId);

    try {
      return await this.entityManager.transaction(async (transactionDbManager) => {
        const blogPost = transactionDbManager.create(BlogPost, {
          ...body,
          status: BlogPostStatusEnum.ON_REVIEW,
        });
        const avatarUrl = await this.s3Service.uploadImage(uploadImage, {
          publisherId,
          blogId,
          postId: blogPost.id,
        });

        blogPost.avatar = avatarUrl;
        await transactionDbManager.save(blogPost);

        return blogPost;
      });
    } catch (e) {
      throw new InternalServerErrorException(`Post was not created. Error: ${e.message}`);
    }
  }

  public async getBlogPostByIdAccordingToAvailability(
    blogPostId: string,
    userId?: string,
  ): Promise<BlogPost> {
    const blogPost = await this.getBlogPostById(blogPostId);
    if (blogPost.status == BlogPostStatusEnum.PUBLISHED) {
      return blogPost;
    }

    if (!userId) {
      throw new UnauthorizedException('Sign in first');
    }

    const user = await this.userService.getUserById(userId);
    if (user.id == userId || user.role.value == RolesEnum.MODERATOR) {
      return blogPost;
    }

    throw new NotFoundException('Blog post was not found');
  }

  public async getPostsByBlogId(
    blogId: string,
    query: PaginationTypeOrmResponseDto,
  ): Promise<FilteredResponseDto<BlogPost>> {
    const { take, skip } = query;

    try {
      const [rows, count] = await this.blogPostRepository
        .createQueryBuilder('blogPost')
        .where('blogPost.blogId = :blogId', { blogId })
        .andWhere('blogPost.status = :status', { status: BlogPostStatusEnum.ON_REVIEW })
        .take(take)
        .skip(skip)
        .orderBy('createdAt', 'DESC')
        .getManyAndCount();

      return {
        total: count,
        data: rows,
      };
    } catch (e) {
      throw new InternalServerErrorException(`Can't extract images from db. Error: ${e.message}`);
    }
  }

  public async updateBlogPost(userId: string, dto: UpdateBlogPostDto): Promise<BlogPost> {
    const blogPost = await this.getBlogPostById(dto.blogPostId);
    if (blogPost.blog.publisher.id != userId) {
      throw new ForbiddenException('User is not blog-post owner');
    }

    try {
      blogPost.title = dto.title ? dto.title : blogPost.title;
      blogPost.description = dto.description ? dto.description : blogPost.description;

      blogPost.status = BlogPostStatusEnum.ON_REVIEW;

      return this.blogPostRepository.save(blogPost);
    } catch (e) {
      throw new InternalServerErrorException(`Can't update blog post. Error: ${e.message}`);
    }
  }

  public async handleModeratorDecision(dto: UpdateBlogPostDecisionDto): Promise<BlogPost> {
    const blogPost = await this.getBlogPostById(dto.blogPostId);
    if (blogPost.status != BlogPostStatusEnum.ON_REVIEW) {
      throw new BadRequestException(`Decision can't be handled`);
    }

    const status =
      dto.decision == BlogPostDecisionEnum.PUBLISH
        ? BlogPostStatusEnum.PUBLISHED
        : BlogPostStatusEnum.REJECTED;
    blogPost.status = status;

    return this.blogPostRepository.save(blogPost);
  }

  public async deleteBlogPost(blogPostId: string, userId: string): Promise<void> {
    const blogPost = await this.getBlogPostById(blogPostId);
    if (blogPost.blog.publisher.id != userId) {
      throw new ForbiddenException('User is not blog-post owner');
    }

    try {
      await this.entityManager.transaction(async (transactionDbManager) => {
        const avatarUrl = blogPost.avatar;
        await transactionDbManager.remove(blogPost);
        await this.s3Service.deleteImageByUrl(avatarUrl);
      });
    } catch (e) {
      throw new InternalServerErrorException(`Image wasn't deleted. Error: ${e.message}`);
    }
  }

  private async getBlogPostById(blogPostId: string): Promise<BlogPost> {
    const image = await this.blogPostRepository.findOne({
      where: { id: blogPostId },
      relations: { blog: { publisher: true } },
    });
    if (!image) {
      throw new NotFoundException('Post not found');
    }

    return image;
  }
}
