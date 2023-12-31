import { ConfigService } from '@nestjs/config';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLVoid } from 'graphql-scalars';

import { GqlRolesGuard } from '../auth/gql-roles-guard';
import { RolesEnum } from '../role/entity/roles.enum';
import { GqlRoles } from '../auth/role-auth.decorator';
import { RequestUser } from '../../shared/decorators/user.decorator';

import { BlogService } from './blog.service';
import { PaginationUtility } from '../../shared/utils/pagination.utility';

import { Blog } from './entity/blog.entity';

import { BlogCreateDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PayloadUser } from '../../shared/payload-user.interface';
import { PaginationDto } from '../../shared/pagination.dto';
import { PaginatedBlogResponseDto } from './dto/paginated-blog.response.dto';

@Resolver(() => Blog)
export class BlogResolver {
  private paginationUtil: PaginationUtility;

  constructor(private readonly blogService: BlogService, private configService: ConfigService) {
    const defaultPerPage = Number(configService.get('DEFAULT_PER_PAGE'));
    this.paginationUtil = new PaginationUtility(defaultPerPage);
  }

  @Mutation(() => Blog)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  public async createBlog(
    @RequestUser() user: PayloadUser,
    @Args('createBlogInput') body: BlogCreateDto,
  ): Promise<Blog> {
    return await this.blogService.createBlog(user.id, body);
  }

  @Query(() => PaginatedBlogResponseDto)
  public async getPaginatedBlogsList(
    @Args('paginateDtoInput') query: PaginationDto,
  ): Promise<PaginatedBlogResponseDto> {
    const typeOrmQuery = this.paginationUtil.parse(query);
    const { data, total } = await this.blogService.getPaginatedBlogsList(typeOrmQuery);

    return {
      page: typeOrmQuery.page,
      perPage: typeOrmQuery.take,
      totalPages: Math.ceil(total / typeOrmQuery.take),
      total,
      data,
    };
  }

  @Mutation(() => Blog)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  public async patchBlog(
    @RequestUser() user: PayloadUser,
    @Args('updateBlogInput') body: UpdateBlogDto,
  ): Promise<Blog> {
    return this.blogService.patchBlog(user.id, body);
  }

  @Mutation(() => GraphQLVoid)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER)
  public async deleteBlogById(
    @Args('blogId') blogId: string,
    @RequestUser() user: PayloadUser,
  ): Promise<void> {
    return this.blogService.deleteBlogById(user.id, blogId);
  }
}
