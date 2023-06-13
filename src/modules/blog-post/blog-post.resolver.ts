import { UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { GraphQLVoid } from 'graphql-scalars';

import { BlogPostService } from './blog-post.service';
import { PaginationUtility } from '../../shared/utils/pagination.utility';

import { JwtResolveGuard } from '../auth/jwt-resolve.guard';
import { GqlRolesGuard } from '../auth/gql-roles-guard';
import { GqlRoles } from '../auth/role-auth.decorator';

import { PaginationDto } from '../../shared/pagination.dto';
import { RequestUser } from '../../shared/decorators/user.decorator';
import { PayloadUser } from '../../shared/payload-user.interface';
import { RolesEnum } from '../role/entity/roles.enum';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { BlogPost } from './entity/blog-post.entity';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { UpdateBlogPostDecisionDto } from './dto/update-blog-post-decision.dto';
import { PaginatedBlogPostResponseDto } from './dto/paginated-blog-post.response.dto';

@Resolver(() => BlogPost)
export class BlogPostResolver {
  private paginationUtil: PaginationUtility;

  constructor(
    private readonly blogPostService: BlogPostService,
    private configService: ConfigService,
  ) {
    const defaultPerPage = Number(configService.get('DEFAULT_PER_PAGE'));
    this.paginationUtil = new PaginationUtility(defaultPerPage);
  }

  @Mutation(() => BlogPost)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  public async createBlogPost(
    @RequestUser() user: PayloadUser,
    @Args('createBlogPostInput') body: CreateBlogPostDto,
  ): Promise<BlogPost> {
    return await this.blogPostService.createBlogPost(user.id, body);
  }

  @Query(() => BlogPost)
  @UseGuards(JwtResolveGuard)
  public async getBlogPostById(
    @Args('blogPostId') blogPostId: string,
    @RequestUser() user: PayloadUser,
  ): Promise<BlogPost> {
    return this.blogPostService.getBlogPostByIdAccordingToAvailability(blogPostId, user?.id);
  }

  @Query(() => PaginatedBlogPostResponseDto)
  public async getPostsByBlogId(
    @Args('paginateDtoInput') query: PaginationDto,
    @Args('blogId') blogId: string,
  ): Promise<PaginatedBlogPostResponseDto> {
    const typeOrmQuery = this.paginationUtil.parse(query);
    const { data, total } = await this.blogPostService.getPostsByBlogId(blogId, typeOrmQuery);

    return {
      page: typeOrmQuery.page,
      perPage: typeOrmQuery.take,
      totalPages: Math.ceil(total / typeOrmQuery.take),
      total,
      data,
    };
  }

  @Mutation(() => BlogPost)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  public async updateBlogPost(
    @Args('updateBlogPostInput') dto: UpdateBlogPostDto,
    @RequestUser() user: PayloadUser,
  ): Promise<BlogPost> {
    return await this.blogPostService.updateBlogPost(user.id, dto);
  }

  @Mutation(() => BlogPost)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  public async updateBlogPostAvatar(
    @Args('avatar', { type: () => GraphQLUpload }) file: FileUpload,
    @Args('blogPostId') blogPostId: string,
    @RequestUser() user: PayloadUser,
  ): Promise<BlogPost> {
    return this.blogPostService.updateBlogPostAvatar(blogPostId, user.id, file);
  }

  @Mutation(() => BlogPost, { name: 'handleModeratorDecision' })
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.MODERATOR)
  public async handleModeratorDecision(
    @Args('moderatorDecisionBlogPostInput') dto: UpdateBlogPostDecisionDto,
  ): Promise<BlogPost> {
    return await this.blogPostService.handleModeratorDecision(dto);
  }

  @Mutation(() => GraphQLVoid)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  public async deleteBlogPost(
    @Args('blogPostId') blogPostId: string,
    @RequestUser() user: PayloadUser,
  ): Promise<void> {
    return this.blogPostService.deleteBlogPost(blogPostId, user.id);
  }
}
