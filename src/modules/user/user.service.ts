import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators';
import { BadRequestException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { S3Service } from '../../s3/s3.service';

import { User } from './entity/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { join } from 'path';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private s3Service: S3Service,
    private readonly entityManager: EntityManager,
  ) {}

  public async createUser(body: CreateUserInput): Promise<User> {
    const userCandidate = await this.getUserByEmail(body.email);
    if (userCandidate) {
      throw new BadRequestException('User with this email already exists');
    }

    try {
      const hashedPassword = await this.hashPassword(body.password);
      return this.userRepository.save({ ...body, password: hashedPassword });
    } catch (e) {
      throw new InternalServerErrorException(`Can't create user. Error: ${e.message}`);
    }
  }

  public async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { blogs: true, role: true },
    });
    if (!user) {
      throw new NotFoundException(`Can't find user with id: ${userId}`);
    }

    return user;
  }

  public async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { blogs: true },
    });
    if (!user) {
      throw new NotFoundException(`Can't find user with email: ${email}`);
    }

    return user;
  }

  public async updateUserProfile(userId: string, dto: UpdateUserInput): Promise<User> {
    const user = await this.getUserById(userId);
    const dtoKeys = Object.keys(dto);

    try {
      user.fullName = dtoKeys.indexOf('fullName') > -1 ? dto.fullName : user.fullName;
      user.password = dto.password ? await this.hashPassword(dto.password) : user.password;

      return this.userRepository.save(user);
    } catch (e) {
      throw new InternalServerErrorException(`Can't update user profile. Error: ${e.message}`);
    }
  }

  public async deleteProfile(userId: string): Promise<void> {
    const user = await this.getUserById(userId);

    try {
      await this.userRepository.remove(user);
    } catch (e) {
      throw new InternalServerErrorException(`Can't delete user profile. Error:${e.message}`);
    }

    try {
      await this.entityManager.transaction(async (transactionDbManager) => {
        await transactionDbManager.remove(user);

        const folderPath = join(this.s3Service.getStoragePrefix(), user.id);
        const folderContent = await this.s3Service.listFolderContent(folderPath);
        await this.s3Service.deleteObjects(folderContent);
      });
    } catch (e) {
      throw new InternalServerErrorException(`Can't delete blog. Error: ${e.message}`);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}
