import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Blog } from '../../blog/entity/blog.entity';
import { BlogPostStatusEnum } from './blog-post-status.enum';
@ObjectType()
@Entity({ name: 'blog-posts' })
export class BlogPost {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Field()
  @Column({ type: 'varchar', nullable: false })
  public title: string;

  @Field()
  @Column({ type: 'varchar', nullable: false })
  public description: string;

  @Field()
  @Column({
    enum: BlogPostStatusEnum,
    nullable: false,
    default: BlogPostStatusEnum.ON_REVIEW,
  })
  public status: BlogPostStatusEnum;

  @Field()
  @Column({ type: 'varchar', nullable: true })
  public avatar: string;

  @Field(() => Date)
  @CreateDateColumn()
  public createdAt: Date;

  @Field(() => Blog)
  @ManyToOne(() => Blog)
  public blog: Blog;
}
