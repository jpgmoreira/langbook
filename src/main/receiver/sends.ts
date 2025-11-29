import { ipcMain } from 'electron';
import { Channels } from '@preload/channels';
import { WindowManager } from '@main/data/managers/windowManager';

ipcMain.on(Channels.cancelCardEdit, () => WindowManager.instance.closeEditor());
