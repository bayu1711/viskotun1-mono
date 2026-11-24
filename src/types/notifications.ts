export type TouchpointChannel = 'web_push' | 'telegram' | 'calendar_feed';

export type NudgeAction = 'complete_day' | 'switch_micro' | 'log_rest' | 'open_routine';

export interface TelegramLinkState {
  connected: boolean;
  chatId?: string;
  username?: string;
  linkCode?: string;
  linkCodeIssuedAt?: number;
  connectedAt?: number;
}

export interface UserNotificationPreferences {
  webPushTokens?: string[];
  telegram?: TelegramLinkState;
  calendarFeedToken?: string;
  lastNudgeDate?: string;
  lastNudgeWindowId?: string;
  lastNudgeSentAt?: number;
}

export interface TouchpointConfigStatus {
  webPushVapidConfigured: boolean;
  fcmServerConfigured: boolean;
  telegramBotConfigured: boolean;
  telegramBotUsername?: string;
}

export interface TouchpointStatusResponse {
  userId: string;
  reminderNotificationsEnabled: boolean;
  calendarFeedToken: string;
  calendarFeedHttpsUrl: string;
  calendarFeedWebcalUrl: string;
  webPushTokenCount: number;
  telegram: {
    connected: boolean;
    username?: string;
    linkCode?: string;
    deepLinkUrl?: string;
  };
  config: TouchpointConfigStatus;
}

export interface DailyNudgePayload {
  title: string;
  body: string;
  url: string;
  routineId?: string;
  windowLabel?: string;
}
