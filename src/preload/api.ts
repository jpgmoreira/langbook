import { Channels } from './channels';

export const allowedSendChannels = Object.freeze([] as const);
export const allowedInvokeChannels = Object.freeze([Channels.createProfile] as const);
export const allowedOnChannels = Object.freeze([Channels.loadStartupData] as const);

export interface ElectronAPI {
  send: (channel: (typeof allowedSendChannels)[number], ...data: any[]) => void;
  invoke: <T = void>(channel: (typeof allowedInvokeChannels)[number], ...data: any[]) => Promise<T>;
  on: (channel: (typeof allowedOnChannels)[number], func: (...args: any[]) => void) => void;
}
