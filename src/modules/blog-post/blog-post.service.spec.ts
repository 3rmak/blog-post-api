import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { FileUpload } from 'graphql-upload';

import * as path from 'path';
import * as mime from 'mime';
import { readFile } from 'fs/promises';
import { Readable } from 'stream';

import { AppModule } from '../../app.module';

import { UsersDbInitializer } from '../../../test/initializers/users-db.initializer';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { BlogPostService } from './blog-post.service';
import { BlogService } from '../blog/blog.service';
import { S3Service } from '../../s3/s3.service';

import { User } from '../user/entity/user.entity';

import { BlogCreateDto } from '../blog/dto/create-blog.dto';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { RolesEnum } from '../role/entity/roles.enum';

describe('Image upload testing', () => {
  let blogPostService: BlogPostService;
  let blogService: BlogService;
  let s3Service: S3Service;
  let usersInitializer: UsersDbInitializer;

  let owner: User;

  const imagePathForUpload = path.join(process.cwd(), 'test', 'test-upload.jpg');
  const getUploadFileByData = (data) => {
    return {
      filename: path.basename(imagePathForUpload),
      encoding: '7bit',
      mimetype: mime.lookup(imagePathForUpload),
      createReadStream() {
        return Readable.from(data);
      },
    } as FileUpload;
  };

  const blogCreateDto: BlogCreateDto = {
    name: 'blog name',
    description: 'blog description',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    blogPostService = module.get<BlogPostService>(BlogPostService);

    blogService = module.get<BlogService>(BlogService);

    const userService = module.get<UserService>(UserService);
    const authService = module.get<AuthService>(AuthService);
    usersInitializer = new UsersDbInitializer(userService, authService);
    [owner] = await usersInitializer.initUsers(1, RolesEnum.WRITER);

    s3Service = module.get<S3Service>(S3Service);
  });

  it('blog-post avatar could be updated', async () => {
    const mockUrl = `https://bucket-name.s3.amazonaws.com/${Date.now()}`;
    jest // mock blog-post uploading
      .spyOn(s3Service, 'uploadImage')
      .mockImplementation(() => Promise.resolve(mockUrl));

    const blog = await blogService.createBlog(owner.id, blogCreateDto);
    const postDetails: CreateBlogPostDto = {
      blogId: blog.id,
      title: 'new album',
      description: 'description',
    };

    const blogPost = await blogPostService.createBlogPost(owner.id, postDetails);

    expect(blogPost.id).toBeDefined();
    expect(blogPost.description).toBe(postDetails.description);
    expect(blogPost.blog.id).toBe(postDetails.blogId);
    expect(blogPost.title).toBe(postDetails.title);

    const data = await readFile(imagePathForUpload);
    const file = getUploadFileByData(data);

    const updatedPost = await blogPostService.updateBlogPostAvatar(blogPost.id, owner.id, file);
    expect(blogPost.id).toBe(updatedPost.id);
    expect(updatedPost.avatar).toBe(mockUrl);
  });

  it('blog-post avatar should not be updated', async () => {
    jest // mock blog-post uploading
      .spyOn(s3Service, 'uploadImage')
      .mockImplementation(() => Promise.reject('reason'));

    const blog = await blogService.createBlog(owner.id, blogCreateDto);
    const postDetails: CreateBlogPostDto = {
      blogId: blog.id,
      title: 'new album',
      description: 'description',
    };
    const blogPost = await blogPostService.createBlogPost(owner.id, postDetails);

    try {
      const data = await readFile(imagePathForUpload);
      const file = getUploadFileByData(data);

      await blogPostService.updateBlogPostAvatar(blogPost.id, owner.id, file);
    } catch (e) {
      expect(e.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(e.message).toMatch(/Unable to patch. Error:/);
    }

    const response = await blogPostService.getPostsByBlogId(blog.id, {
      page: 1,
      take: 5,
      skip: 0,
    });
    expect(response.data.length).toBe(0);
  });

  it('blog-posts should not be retrieved by post id', async () => {
    const postDetails = {
      title: 'new album',
      description: 'description',
    };

    const ownerBlog = await blogService.createBlog(owner.id, blogCreateDto);
    const ownerPost = await blogPostService.createBlogPost(owner.id, {
      ...postDetails,
      blogId: ownerBlog.id,
    });
    const ownerPost2 = await blogPostService.createBlogPost(owner.id, {
      ...postDetails,
      blogId: ownerBlog.id,
    });

    const { data } = await blogPostService.getPostsByBlogId(ownerBlog.id, {
      page: 1,
      take: 5,
      skip: 0,
    });

    // looking only for published posts
    expect(data.length).toBe(0);
  });

  it('blog-post should be deleted', async () => {
    jest // mock blog-post uploading
      .spyOn(s3Service, 'uploadImage')
      .mockImplementation(() =>
        Promise.resolve(`https://bucket-name.s3.amazonaws.com/${Date.now()}`),
      );

    jest // mock blog-post uploading
      .spyOn(s3Service, 'deleteImageByUrl')
      .mockImplementation(() => Promise.resolve());

    const mockUrl = `https://bucket-name.s3.amazonaws.com/${Date.now()}`;
    jest // mock blog-post uploading
      .spyOn(s3Service, 'uploadImage')
      .mockImplementation(() => Promise.resolve(mockUrl));

    const blog = await blogService.createBlog(owner.id, blogCreateDto);
    const postDetails: CreateBlogPostDto = {
      blogId: blog.id,
      title: 'new album',
      description: 'description',
    };

    const blogPost = await blogPostService.createBlogPost(owner.id, postDetails);

    const data = await readFile(imagePathForUpload);
    const file = getUploadFileByData(data);

    const updatedPost = await blogPostService.updateBlogPostAvatar(blogPost.id, owner.id, file);
    expect(blogPost.id).toBe(updatedPost.id);
    expect(updatedPost.avatar).toBe(mockUrl);

    await blogPostService.deleteBlogPost(blogPost.id, owner.id);

    try {
      await blogPostService.getBlogPostById(blogPost.id);
    } catch (e) {
      expect(e.status).toBe(HttpStatus.NOT_FOUND);
    }
  });

  it('blog-post could not be deleted', async () => {
    jest // mock blog-post uploading
      .spyOn(s3Service, 'uploadImage')
      .mockImplementation(() =>
        Promise.resolve(`https://bucket-name.s3.amazonaws.com/${Date.now()}`),
      );

    jest // mock blog-post uploading
      .spyOn(s3Service, 'deleteImageByUrl')
      .mockImplementation(() => Promise.reject('reason'));

    const blog = await blogService.createBlog(owner.id, blogCreateDto);
    const postDetails: CreateBlogPostDto = {
      blogId: blog.id,
      title: 'new album',
      description: 'description',
    };

    const blogPost = await blogPostService.createBlogPost(owner.id, postDetails);

    const data = await readFile(imagePathForUpload);
    const file = getUploadFileByData(data);

    await blogPostService.updateBlogPostAvatar(blogPost.id, owner.id, file);

    try {
      await blogPostService.deleteBlogPost(blogPost.id, owner.id);
    } catch (e) {
      expect(e.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(e.message).toMatch(/BlogPost wasn't deleted. Error:/);
    }
  });
});
