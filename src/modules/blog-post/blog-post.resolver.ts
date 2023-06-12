import { UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VoidTypeDefinition } from 'graphql-scalars';

import { BlogPostService } from './blog-post.service';
import { PaginationUtility } from '../../shared/utils/pagination.utility';

import { JwtResolveGuard } from '../auth/jwt-resolve.guard';
import { GqlRolesGuard } from '../auth/gql-roles-guard.service';
import { GqlRoles } from '../auth/role-auth.decorator';

import { PaginationDto } from '../../shared/pagination.dto';
import { RequestUser } from '../../shared/decorators/user.decorator';
import { PayloadUser } from '../../shared/payload-user.interface';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { RolesEnum } from '../role/entity/roles.enum';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { BlogPost } from './entity/blog-post.entity';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { UpdateBlogPostDecisionDto } from './dto/update-blog-post-decision.dto';

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

  @Mutation(() => BlogPost, { name: 'createBlogPost' })
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  @UseInterceptors(FileInterceptor('image'))
  public async createBlogPost(
    @RequestUser() user: PayloadUser,
    @UploadedFile() uploadImage: Express.Multer.File,
    @Args('createBlogPostInput') body: CreateBlogPostDto,
  ): Promise<BlogPost> {
    return await this.blogPostService.createBlogPost(user.id, uploadImage, body);
  }

  @Query(() => BlogPost, { name: 'getBlogPostById' })
  @UseGuards(JwtResolveGuard)
  public async getBlogPostById(
    @Args('blogPostId') blogPostId: string,
    @RequestUser() user: PayloadUser,
  ): Promise<BlogPost> {
    return this.blogPostService.getBlogPostByIdAccordingToAvailability(blogPostId, user?.id);
  }

  @Query(() => PaginatedResponseDto<BlogPost>, { name: 'getPostsByBlogId' })
  public async getPostsByBlogId(
    @Args('paginateDtoInput') query: PaginationDto,
    @Args('blogId') blogId: string,
  ): Promise<PaginatedResponseDto<BlogPost>> {
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

  @Mutation(() => BlogPost, { name: 'updateBlogPost' })
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  public async updateBlogPost(
    @Args('updateBlogPostInput') dto: UpdateBlogPostDto,
    @RequestUser() user: PayloadUser,
  ): Promise<BlogPost> {
    return await this.blogPostService.updateBlogPost(user.id, dto);
  }

  @Mutation(() => BlogPost, { name: 'handleModeratorDecision' })
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.MODERATOR)
  public async handleModeratorDecision(
    @Args('moderatorDecisionBlogPostInput') dto: UpdateBlogPostDecisionDto,
  ): Promise<BlogPost> {
    return await this.blogPostService.handleModeratorDecision(dto);
  }

  @Mutation(() => VoidTypeDefinition, { name: 'deleteBlogPost' })
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  public async deleteBlogPost(
    @Args('blogPostId') blogPostId: string,
    @RequestUser() user: PayloadUser,
  ): Promise<void> {
    return this.blogPostService.deleteBlogPost(blogPostId, user.id);
  }
}