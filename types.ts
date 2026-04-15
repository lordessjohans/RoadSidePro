
export interface RepairMessage {
  role: 'user' | 'model';
  text: string;
  urls?: Array<{ title: string; uri: string }>;
  timestamp: number;
}

export enum AppMode {
  ASSIST = 'assist',
  VISUALIZE = 'visualize',
  SEARCH = 'search',
  MAPS = 'maps',
  DIAGNOSE = 'diagnose',
  LIVE_ASSIST = 'live_assist',
  DISPATCH = 'dispatch'
}

export interface ImageGenConfig {
  size: '1K' | '2K' | '4K';
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export interface VideoGenConfig {
  aspectRatio: '16:9' | '9:16';
}
