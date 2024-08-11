import { Body, ConflictException, Controller, Delete, InternalServerErrorException, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { QueryFailedError } from 'typeorm';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService
  ) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Post('order')
  async createOrder(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createOrder(createUserDto);
  }

  @Delete()
  async delete(@Body() createUserDto: CreateUserDto) {
    return await this.userService.delete(createUserDto);
  }

  @Post("restore")
  async restore(@Body() createUserDto: CreateUserDto) {
    return await this.userService.restore(createUserDto);
  }
}
