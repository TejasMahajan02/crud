import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, getManager, getRepository, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { Order } from './entities/order.entity';
import { User } from './entities/user.entity';
import { NotFoundError } from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({ where: { username: createUserDto.username } });
    if (user) {
      throw new ConflictException('Username is not available.');
    }

    return await this.userRepository.save(createUserDto);
  }

  async delete(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({ where: { username: createUserDto.username } });
    if (!user) {
      throw new NotFoundException();
    }

    return this.softDeleteUserAndOrders(user.uuid);

    // return await this.userRepository.delete(user.uuid);
  }

  async restore(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({ where: { username: createUserDto.username } });
    if (!user) {
      throw new NotFoundException();
    }

    return this.restoreUserAndOrders(user.uuid);

    // return await this.userRepository.delete(user.uuid);
  }


  async createOrder(createUserDto: CreateUserDto) {
    const userEntity = await this.userRepository.findOne({ where: { username: createUserDto.username } });
    if (!userEntity) {
      throw new NotFoundException();
    }

    const order = new Order();
    order.user = userEntity;
    return await this.orderRepository.save(order);
  }

  async softDeleteUserAndOrders(uuid: string): Promise<string> {
    try {
      const result = await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
        // Soft delete the user
        const userResult = await transactionalEntityManager.update(User, { uuid }, { isDeleted: true });
  
        if (userResult.affected > 0) {
          // Soft delete the related orders
          await transactionalEntityManager.createQueryBuilder()
            .update(Order)
            .set({ isDeleted: true })
            .where("userId = :uuid", { uuid })
            .andWhere("isDeleted = false")
            .execute();
  
          return `User with ID ${uuid} and related orders have been successfully marked as deleted.`;
        }
  
        return `User with ID ${uuid} was not found or is already marked as deleted.`;
      });
  
      return result; // Return the result from the transaction
    } catch (error) {
      // Handle error
      console.error('Error during soft delete:', error);
      return 'An error occurred during the deletion process.';
    }
  }
  
  async restoreUserAndOrders(uuid: string): Promise<string> {
    try {
      const result = await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
        // Restore the user
        const userResult = await transactionalEntityManager.update(User, { uuid, isDeleted: true }, { isDeleted: false });
  
        if (userResult.affected > 0) {
          // Restore the related orders
          await transactionalEntityManager.createQueryBuilder()
            .update(Order)
            .set({ isDeleted: false })
            .where("userId = :uuid", { uuid })
            .andWhere("isDeleted = true")
            .execute();
  
          return `User with ID ${uuid} and related orders have been successfully restored.`;
        }
  
        return `User with ID ${uuid} was not found or is not marked as deleted.`;
      });
  
      return result; // Return the result from the transaction
    } catch (error) {
      // Handle error
      console.error('Error during restore:', error);
      return 'An error occurred during the restore process.';
    }
  }
  

}
