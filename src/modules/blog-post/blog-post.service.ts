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
import { FileUpload } from 'graphql-upload';

@Injectable()
export class BlogPostService {
  constructor(
    @InjectRepository(BlogPost) private blogPostRepository: Repository<BlogPost>,
    private blogService: BlogService,
    private userService: UserService,
    private s3Service: S3Service,
    private readonly entityManager: EntityManager,
  ) {}

  public async createBlogPost(publisherId: string, body: CreateBlogPostDto): Promise<BlogPost> {
    const { blogId, title, description } = body;

    // check if blog exist and belongs to publisherId
    await this.blogService.getBlogByPublisherAndId(blogId, publisherId);

    try {
      const blogPost = await this.blogPostRepository.save({
        title,
        description,
        status: BlogPostStatusEnum.ON_REVIEW,
        blog: { id: blogId },
      });

      return this.getBlogPostById(blogPost.id);
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

  public async getBlogPostById(blogPostId: string): Promise<BlogPost> {
    const blogPost = await this.blogPostRepository.findOne({
      where: { id: blogPostId },
      relations: { blog: { publisher: true } },
    });
    if (!blogPost) {
      throw new NotFoundException('Post not found');
    }

    return blogPost;
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
        .andWhere('blogPost.status = :status', { status: BlogPostStatusEnum.PUBLISHED })
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

  public async updateBlogPostAvatar(
    blogPostId: string,
    publisherId: string,
    file: FileUpload,
  ): Promise<BlogPost> {
    const blogPost = await this.getBlogPostById(blogPostId);
    if (blogPost.blog.publisher.id != publisherId) {
      throw new ForbiddenException('You are not allowed to patch this blog');
    }

    try {
      const avatarUrl = await this.s3Service.uploadImage(file, {
        publisherId,
        blogId: blogPost.blog.id,
        postId: blogPostId,
      });

      blogPost.avatar = avatarUrl;
      return this.blogPostRepository.save(blogPost);
    } catch (e) {
      throw new InternalServerErrorException(`Unable to patch. Error:" ${e.message}`);
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
        if (avatarUrl) {
          await this.s3Service.deleteImageByUrl(avatarUrl);
        }
      });
    } catch (e) {
      throw new InternalServerErrorException(`BlogPost wasn't deleted. Error: ${e.message}`);
    }
  }
}
