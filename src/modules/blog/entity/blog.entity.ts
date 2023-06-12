import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BlogPost } from '../../blog-post/entity/blog-post.entity';
import { User } from '../../user/entity/user.entity';

@ObjectType()
@Entity({ name: 'blogs' })
export class Blog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Field()
  @Column({ type: 'varchar', unique: false, nullable: false })
  public name: string;

  @Field()
  @Column({ type: 'varchar', nullable: false })
  public description: string;

  @Field(() => [BlogPost])
  @OneToMany(() => BlogPost, (blogPost) => blogPost.blog, { onDelete: 'CASCADE' })
  public blogPosts: BlogPost[];

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.blogs)
  public publisher: User;
}
