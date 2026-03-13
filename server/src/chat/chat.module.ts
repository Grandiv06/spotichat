import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { OnlineUsersService } from './online-users.service';
import { ChatEntity, ChatSchema } from '../common/schemas/chat.schema';
import { Message, MessageSchema } from '../common/schemas/message.schema';
import { User, UserSchema } from '../common/schemas/user.schema';
import { BlockedUser, BlockedUserSchema } from '../common/schemas/blocked-user.schema';
import { EncryptionService } from '../common/encryption.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatEntity.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: BlockedUser.name, schema: BlockedUserSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'spotichat_jwt_secret_dev_2024'),
      }),
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, OnlineUsersService, EncryptionService],
  exports: [ChatService, OnlineUsersService],
})
export class ChatModule {}
