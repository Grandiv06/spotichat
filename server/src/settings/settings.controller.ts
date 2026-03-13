import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // ── Privacy ──
  @Get('settings/privacy')
  getPrivacy(@CurrentUser() user: any) {
    return this.settingsService.getPrivacy(user.userId);
  }

  @Put('settings/privacy')
  updatePrivacy(@CurrentUser() user: any, @Body() body: any) {
    return this.settingsService.updatePrivacy(user.userId, body);
  }

  // ── Notifications ──
  @Get('settings/notifications')
  getNotifications(@CurrentUser() user: any) {
    return this.settingsService.getNotifications(user.userId);
  }

  @Put('settings/notifications')
  updateNotifications(@CurrentUser() user: any, @Body() body: any) {
    return this.settingsService.updateNotifications(user.userId, body);
  }

  // ── Blocked Users ──
  @Get('blocked-users')
  getBlockedUsers(@CurrentUser() user: any) {
    return this.settingsService.getBlockedUsers(user.userId);
  }

  @Post('blocked-users/:userId')
  blockUser(@CurrentUser() user: any, @Param('userId') targetUserId: string) {
    return this.settingsService.blockUser(user.userId, targetUserId);
  }

  @Delete('blocked-users/:userId')
  unblockUser(@CurrentUser() user: any, @Param('userId') targetUserId: string) {
    return this.settingsService.unblockUser(user.userId, targetUserId);
  }

  // ── Sessions ──
  @Get('sessions')
  getSessions(@CurrentUser() user: any) {
    return this.settingsService.getSessions(user.userId);
  }

  @Delete('sessions/:id')
  terminateSession(@CurrentUser() user: any, @Param('id') sessionId: string) {
    return this.settingsService.terminateSession(user.userId, sessionId);
  }

  @Delete('sessions')
  terminateAllOtherSessions(@CurrentUser() user: any) {
    return this.settingsService.terminateAllOtherSessions(user.userId);
  }
}
