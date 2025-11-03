import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { AdminRolesGuard } from 'src/auth/guard/roles/admin-roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';

// Buscar os dados de um user (check)
// cadastrar um user (check)
//deletar um user 
// atualizar um user
@UseGuards(AuthTokenGuard)
@Controller('usuarios')
export class UsersController {

  constructor(private readonly usersService: UsersService) { }

  // @UseGuards(AdminRolesGuard)
  @Post('cadastrar-usuario')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto)
  }

  @Get()
  findUsers(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto)
  }

  @UseGuards(AdminRolesGuard)
  @Patch(':id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {

    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AdminRolesGuard)
  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id)
  }

}