import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';

import { AppModule } from '../src/app.module';

import { UserService } from '../src/modules/user/user.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { BlogService } from '../src/modules/blog/blog.service';
import { UsersDbInitializer } from './initializers/users-db.initializer';

import { RolesEnum } from '../src/modules/role/entity/roles.enum';
import { User } from '../src/modules/user/entity/user.entity';
import { BlogPostStatusEnum } from '../src/modules/blog-post/entity/blog-post-status.enum';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let url: string;

  let blogService: BlogService;

  let user: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const userService = moduleFixture.get<UserService>(UserService);
    const authService = moduleFixture.get<AuthService>(AuthService);
    blogService = moduleFixture.get<BlogService>(BlogService);
    const usersInitializer = new UsersDbInitializer(userService, authService);
    [user] = await usersInitializer.initUsers(1, RolesEnum.WRITER);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(0);
    url = await app.getUrl();
    pactum.request.setBaseUrl(url.replace('[::1]', 'localhost'));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/graphql', () => {
    it('writer user should be created', () => {
      const userInput = { email: 'user5@gmail.com', password: 'password' };

      return pactum
        .spec()
        .post('/graphql')
        .withGraphQLQuery(
          `mutation createUser($userInput: CreateUserInput!) {
            createUser(createUserInput:$userInput){
              email
              role {
                value
              }
            }
          }`,
        )
        .withGraphQLVariables({
          userInput,
        })
        .expectStatus(200)
        .expectJson({
          data: {
            createUser: {
              email: userInput.email,
              role: {
                value: RolesEnum.WRITER,
              },
            },
          },
        });
    });

    it('blog should be created', async () => {
      const blogInput = {
        name: 'Long blog',
        description: 'Long descr',
      };

      return pactum
        .spec()
        .post('/graphql')
        .withBearerToken(user.password)
        .withGraphQLQuery(
          `mutation createBlog($blogInput: BlogCreateDto) {
            createBlog(createBlogInput: $blogInput) {
              name
              description
              publisher: {
                id
              }
            }
          }`,
        )
        .withGraphQLVariables({
          blogInput,
        })
        .expectStatus(200)
        .expectJson({
          data: {
            createBlog: {
              name: blogInput.name,
              description: blogInput.description,
              publisher: {
                id: user.id,
              },
            },
          },
        });
    });

    it('blog post should be created', async () => {
      const blogInput = {
        name: 'Long blog',
        description: 'Long descr',
      };
      const blog = await blogService.createBlog(user.id, blogInput);
      const blogPostInput = {
        title: 'Long blog',
        description: 'Long descr',
        blogId: blog.id,
      };

      return pactum
        .spec()
        .post('/graphql')
        .withBearerToken(user.password)
        .withGraphQLQuery(
          `mutation createBlogPost($blogPostInput: CreateBlogPostDto) {
            createBlogPost(createBlogPostInput: $blogPostInput}) {
              title
              description
              status
              blog: {
                id
                name
                description
                publisher: {
                  id
                }
              }
            }
          }`,
        )
        .withGraphQLVariables({
          blogPostInput,
        })
        .expectStatus(200)
        .expectJson({
          data: {
            createBlogPost: {
              title: blogPostInput.title,
              description: blogPostInput.description,
              status: BlogPostStatusEnum.ON_REVIEW,
              blog: {
                id: blogPostInput.blogId,
                name: blog.name,
                description: blog.description,
                publisher: {
                  id: user.id,
                },
              },
            },
          },
        });
    });
  });
});
