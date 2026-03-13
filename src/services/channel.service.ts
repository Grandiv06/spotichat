import { apiFetch } from "@/lib/api";
import { emitSocket, onSocketEvent } from "@/lib/socket";
import type { User } from "./auth.service";

export type ChannelVisibility = "public" | "private";
export type ChannelRole = "owner" | "admin" | "subscriber";

export interface Channel {
  id: string;
  name: string;
  username?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  visibility: ChannelVisibility;
  createdAt: string;
  createdBy: string;
  subscriberCount: number;
  // optional: minimal role of current user in this channel
  currentUserRole?: ChannelRole;
}

export interface ChannelMember {
  user: User;
  role: ChannelRole;
  isBanned?: boolean;
  joinedAt: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  sender: {
    id: string;
    name?: string | null;
  };
  text?: string;
  type: "text" | "file" | "voice" | "video";
  fileUrl?: string;
  createdAt: string;
  // Telegram-style extras
  views: number;
  authorSignature?: string | null;
}

export interface CreateChannelPayload {
  name: string;
  description?: string;
  visibility: ChannelVisibility;
  username?: string;
  avatarFile?: File | null;
  initialSubscriberIds?: string[];
}

export interface ChannelRoleUpdatePayload {
  userId: string;
  role: ChannelRole;
}

export interface BanUserPayload {
  userId: string;
  reason?: string;
}

// NOTE:
// Endpoints are intentionally generic / placeholder so backend URLs can be plugged in later.

export const channelService = {
  // REST: basic CRUD / queries
  getMyChannels: async (): Promise<Channel[]> => {
    // TODO: replace `/channels` with real backend route
    return apiFetch("/channels");
  },

  getChannelById: async (channelId: string): Promise<Channel> => {
    return apiFetch(`/channels/${channelId}`);
  },

  checkUsernameAvailable: async (username: string): Promise<{ available: boolean }> => {
    // Example: GET /channels/username-available?username=...
    return apiFetch(`/channels/username-available?username=${encodeURIComponent(username)}`);
  },

  createChannel: async (payload: CreateChannelPayload): Promise<Channel> => {
    // If avatar upload is required, switch to FormData here.
    const { avatarFile, ...json } = payload;
    return apiFetch("/channels", {
      method: "POST",
      body: JSON.stringify(json),
    });
  },

  getChannelMessages: async (
    channelId: string,
    page = 1,
    limit = 50,
  ): Promise<ChannelMessage[]> => {
    return apiFetch(`/channels/${channelId}/messages?page=${page}&limit=${limit}`);
  },

  sendChannelMessage: async (
    channelId: string,
    data: Pick<ChannelMessage, "text" | "type" | "fileUrl" | "authorSignature">,
  ): Promise<ChannelMessage> => {
    const wsPayload = {
      channelId,
      text: data.text,
      type: data.type,
      fileUrl: data.fileUrl,
      authorSignature: data.authorSignature,
    };

    const restFallback = () =>
      apiFetch(`/channels/${channelId}/messages`, {
        method: "POST",
        body: JSON.stringify(wsPayload),
      });

    try {
      const result = await Promise.race([
        emitSocket("channel:message:send", wsPayload),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Socket timeout")), 4000),
        ),
      ]);
      if (result && (result as any).success && (result as any).message) {
        return (result as any).message as ChannelMessage;
      }
    } catch {
      // ignore and fall back
    }

    return restFallback();
  },

  // Admin / permissions
  updateMemberRole: async (
    channelId: string,
    payload: ChannelRoleUpdatePayload,
  ): Promise<ChannelMember> => {
    return apiFetch(`/channels/${channelId}/members/${payload.userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: payload.role }),
    });
  },

  banUser: async (
    channelId: string,
    payload: BanUserPayload,
  ): Promise<{ success: boolean }> => {
    return apiFetch(`/channels/${channelId}/bans`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Realtime via Socket.IO
  onChannelMessage: (cb: (msg: ChannelMessage) => void) => {
    return onSocketEvent("channel:message", (msg: ChannelMessage) => cb(msg));
  },

  onChannelStats: (
    cb: (data: { channelId: string; subscriberCount: number }) => void,
  ) => {
    return onSocketEvent(
      "channel:stats",
      (data: { channelId: string; subscriberCount: number }) => cb(data),
    );
  },

  onChannelRecentAction: (
    cb: (data: { channelId: string; description: string; createdAt: string }) => void,
  ) => {
    return onSocketEvent(
      "channel:recent-action",
      (data: { channelId: string; description: string; createdAt: string }) => cb(data),
    );
  },
};

