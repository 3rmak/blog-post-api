import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, ManyToOne } from 'typeorm';
import { randomUUID } from 'crypto';

import { Blog } from '../../blog/entity/blog.entity';
import { BlogPostStatusEnum } from './blog-post-status.enum';

@ObjectType()
@Entity({ name: 'blog-posts' })
export class BlogPost {
  @Field(() => ID)
  @Column({ type: 'uuid', unique: true, primary: true, default: randomUUID() })
  public id: string;

  @Field()
  @Column({ type: 'varchar', nullable: false })
  public title: string;

  @Field()
  @Column({ type: 'varchar', nullable: false })
  public description: string;

  @Field()
  @Column({
    type: 'enum',
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
  @Column({ type: 'date', default: new Date() })
  public createdAt: Date;

  @Field(() => Blog)
  @ManyToOne(() => Blog)
  public blog: Blog;
}
