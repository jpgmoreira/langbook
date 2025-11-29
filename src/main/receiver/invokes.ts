import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import { Card } from '@common/schemas/card';
import { Filters } from '@common/schemas/filters';
import { StartupData } from '@common/schemas/startup';
import { CardsManager } from '@main/data/managers/cardsManager';
import { FiltersManager } from '@main/data/managers/filtersManager';
import { ProfileManager } from '@main/data/managers/profileManager';
import { WindowManager } from '@main/data/managers/windowManager';
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

ipcMain.handle(
  Channels.renameProfile,
  async (_: IpcMainInvokeEvent, profileId: string, name: string): Promise<GenericResponseDTO> =>
    ProfileManager.instance.renameProfile(profileId, name)
);

ipcMain.handle(
  Channels.deleteProfile,
  async (_: IpcMainInvokeEvent, profileId: string): Promise<GenericResponseDTO> =>
    ProfileManager.instance.deleteProfile(profileId)
);

ipcMain.handle(
  Channels.login,
  async (_: IpcMainInvokeEvent, profileId: string): Promise<StartupData> => {
    ProfileManager.instance.login(profileId);
    return loadStartupData();
  }
);

ipcMain.handle(Channels.openEditor, async (_: IpcMainInvokeEvent, card: Card | null) => {
  WindowManager.instance.openEditor(card);
});

ipcMain.handle(Channels.upsertCard, async (_: IpcMainInvokeEvent, card: Card) => {
  CardsManager.instance.upsertCard(card);
});

ipcMain.handle(Channels.updateFilters, async (_: IpcMainInvokeEvent, filters: Filters) => {
  FiltersManager.instance.updateFilters(filters);
  CardsManager.instance.refreshCardsView(true);
});
