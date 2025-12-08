import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import { GetNewCardResponseDTO } from '@common/dto/getNewCardResponseDTO';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { Card } from '@common/schemas/card';
import { Filters } from '@common/schemas/filters';
import { RefreshPlace } from '@common/types/refreshPlace';
import { sleep } from '@common/utils/utils';
import { CardsManager } from '@main/data/managers/cards/cardsManager';
import { FiltersManager } from '@main/data/managers/filtersManager';
import { ProfileManager } from '@main/data/managers/profileManager';
import { SessionsManager } from '@main/data/managers/sessionsManager';
import { TagsManager } from '@main/data/managers/tagsManager';
import { TreeManager } from '@main/data/managers/treeManager';
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
  async (_: IpcMainInvokeEvent, profileId: string): Promise<RendererResponseDTO> => {
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

ipcMain.handle(
  Channels.filter,
  async (_: IpcMainInvokeEvent, filters: Filters): Promise<RendererResponseDTO> => {
    FiltersManager.instance.updateFilters(filters);
    CardsManager.instance.refresh();
    const { page, height, nFiltered } = CardsManager.instance.getPage(0);
    const data: RendererResponseDTO = {
      where: [RefreshPlace.HOME_PAGE_NEW_PAGE],
      height,
      page,
      nFiltered,
    };
    return data;
  }
);

ipcMain.handle(Channels.deleteCard, async (_: IpcMainInvokeEvent, card: Card) => {
  await sleep(1000);
  await CardsManager.instance.deleteCard(card);
  const { page, height, nFiltered } = CardsManager.instance.getCurrentPageRefreshed();
  const nFilteredReview = CardsManager.instance.getNFilteredReview();
  const nFilteredSuspended = CardsManager.instance.getNFilteredSuspended();
  const nSeen = CardsManager.instance.getNSeen();
  const mainWindowData: RendererResponseDTO = {
    where: [
      RefreshPlace.HOME_PAGE,
      RefreshPlace.FILTERS_STORE,
      RefreshPlace.PROFILE_STORE_REGISTRY,
    ],
    profileRegistry: ProfileManager.instance.getProfileRegistry(),
    tags: TagsManager.instance.getTags(),
    sessions: SessionsManager.instance.getSessions(),
    hasSessions: TreeManager.instance.getNFiles() > 0,
    filters: FiltersManager.instance.getFilters(),
    page,
    nFiltered,
    height,
  };
  const flashcardsWindowData: RendererResponseDTO = {
    where: [RefreshPlace.FLASHCARDS_PAGE_CARD_DELETED],
    nFiltered,
    nFilteredReview,
    nFilteredSuspended,
    nSeen,
    card,
  };
  WindowManager.instance.sendDataToMainWindow(mainWindowData);
  WindowManager.instance.sendDataToFlashcardsWindow(flashcardsWindowData);
});

ipcMain.handle(Channels.getPage, async (_: IpcMainInvokeEvent, scrollTop: number) => {
  const { page, height, nFiltered } = CardsManager.instance.getPage(scrollTop);
  const data: RendererResponseDTO = {
    where: [RefreshPlace.HOME_PAGE_NEW_PAGE],
    page,
    height,
    nFiltered,
  };
  WindowManager.instance.sendDataToMainWindow(data);
});

ipcMain.handle(Channels.openFlashcards, async (_: IpcMainInvokeEvent) => {
  WindowManager.instance.openFlashcards();
});

ipcMain.handle(
  Channels.getNewCard,
  async (_: IpcMainInvokeEvent): Promise<GetNewCardResponseDTO> => {
    return CardsManager.instance.getNextCard();
  }
);
