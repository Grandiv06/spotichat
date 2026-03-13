import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContactsService } from './contacts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsOptional, IsString } from 'class-validator';

class AddContactDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  customName?: string;
}

@Controller('contacts')
@UseGuards(AuthGuard('jwt'))
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  getContacts(@CurrentUser() user: any) {
    return this.contactsService.getContacts(user.userId);
  }

  @Post()
  addContact(@CurrentUser() user: any, @Body() dto: AddContactDto) {
    return this.contactsService.addContact(user.userId, dto);
  }

  @Delete(':id')
  removeContact(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.removeContact(user.userId, id);
  }
}
