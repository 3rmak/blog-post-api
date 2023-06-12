import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Blog } from '../../blog/entity/blog.entity';
import { Role } from '../../role/entity/role.entity';

// export const UserPasswordRegex = new RegExp('^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,64})');
export const UserPasswordRegex = new RegExp('[a-z]{8,64}');

@ObjectType()
@Entity({ name: 'users' })
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Field()
  @Column({ type: 'varchar', unique: true, nullable: false })
  public email: string;

  @Field()
  @Column({ type: 'varchar', nullable: false })
  public password: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, default: null })
  public fullName: string;

  @Field(() => Role)
  @ManyToOne(() => Role, (role) => role.users)
  public role: Role;

  @Field(() => [Blog], { nullable: true })
  @OneToMany(() => Blog, (blog) => blog.publisher, { onDelete: 'CASCADE' })
  public blogs: Blog[];
}
