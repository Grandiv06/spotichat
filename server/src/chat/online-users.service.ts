import { Injectable } from '@nestjs/common';

@Injectable()
export class OnlineUsersService {
  private onlineUserIds = new Set<string>();

  add(userId: string): void {
    this.onlineUserIds.add(userId);
  }

  remove(userId: string): void {
    this.onlineUserIds.delete(userId);
  }

  getAll(): string[] {
    return Array.from(this.onlineUserIds);
  }

  has(userId: string): boolean {
    return this.onlineUserIds.has(userId);
  }
}
