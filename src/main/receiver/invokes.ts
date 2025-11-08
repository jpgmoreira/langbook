import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { ProfileManager } from '@main/data/managers/profileManager';
import { loadStartupData } from '@main/data/startup';
import { Channels } from '@preload/channels';
import { ipcMain, IpcMainInvokeEvent } from 'electron';

ipcMain.handle(
  Channels.createProfile,
  async (_: IpcMainInvokeEvent, name: string): Promise<CreateProfileResponseDTO> => {
    const result = ProfileManager.instance.createProfile(name);
    if (result.status === 'error') {
      return result;
    }
    const data = await loadStartupData();
    return {
      status: 'success',
      data,
    };
  }
);
