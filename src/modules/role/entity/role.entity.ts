import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../user/entity/user.entity';
import { RolesEnum } from './roles.enum';

@ObjectType('Role')
@Entity({ name: 'roles' })
export class Role {
  @Field()
  @PrimaryGeneratedColumn('increment')
  public id: number;

  @Field()
  @Column({ enum: RolesEnum, unique: true, nullable: false })
  public value: RolesEnum;

  @Field(() => [User])
  @OneToMany(() => User, (user) => user.role)
  public users: User[];
}
