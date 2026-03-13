import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChatService } from './chat.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsOptional, IsString } from 'class-validator';

class SendMessageDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;
}

class StartChatDto {
  @IsString()
  otherUserId: string;
}

@Controller('chats')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  getChats(@CurrentUser() user: any) {
    return this.chatService.getChats(user.userId);
  }

  @Post('start')
  async startChat(@CurrentUser() user: any, @Body() dto: StartChatDto) {
    const chatId = await this.chatService.getOrCreatePrivateChat(user.userId, dto.otherUserId);
    return { chatId };
  }

  @Get(':id/messages')
  getMessages(
    @CurrentUser() user: any,
    @Param('id') chatId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      chatId,
      user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post(':id/messages')
  sendMessage(
    @CurrentUser() user: any,
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(chatId, user.userId, dto);
  }

  @Post(':id/messages/media')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/media',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async sendMediaMessage(
    @CurrentUser() user: any,
    @Param('id') chatId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const fileUrl = `/uploads/media/${file.filename}`;
    return this.chatService.sendMessage(chatId, user.userId, {
      type: body.type || 'file',
      fileUrl,
      duration: body.duration ? parseFloat(body.duration) : undefined,
      replyToId: body.replyToId,
    });
  }
}
