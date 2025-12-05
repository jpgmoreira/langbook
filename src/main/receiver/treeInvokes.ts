import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { TreeChannels } from '@preload/treeChannels';
import { TreeManager } from '@main/data/managers/treeManager';
import { NodeType } from '@common/types/tree';
import { ModifierKeys } from '@common/types/keys';
import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import { measure } from '@main/utils/performance';
import { sleep } from '@common/utils/utils';
import { WindowManager } from '@main/data/managers/windowManager';
import { CardsManager } from '@main/data/managers/cardsManager';
import { TagsManager } from '@main/data/managers/tagsManager';
import { RefreshPlace } from '@common/types/refreshPlace';
import { FiltersManager } from '@main/data/managers/filtersManager';
import { ProfileManager } from '@main/data/managers/profileManager';

ipcMain.handle(
  TreeChannels.createNode,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    type: NodeType,
    prefix: string,
    parentId: string | null
  ): TreeOperationResponseDTO => {
    return measure('createNode', () => {
      TreeManager.instance.createNode(type, prefix, parentId);
      const hasSessions = TreeManager.instance.getNFiles() > 0;
      WindowManager.instance.sendDataToMainWindow({
        where: [RefreshPlace.HOME_PAGE, RefreshPlace.PROFILE_STORE],
        hasSessions,
      });
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.createNodeAbove,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    type: NodeType,
    prefix: string,
    baseNodeId: string
  ): TreeOperationResponseDTO => {
    return measure('createNodeAbove', () => {
      TreeManager.instance.createNodeAbove(type, prefix, baseNodeId);
      const hasSessions = TreeManager.instance.getNFiles() > 0;
      WindowManager.instance.sendDataToMainWindow({
        where: [RefreshPlace.HOME_PAGE, RefreshPlace.PROFILE_STORE],
        hasSessions,
      });
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.createNodeBelow,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    type: NodeType,
    prefix: string,
    baseNodeId: string
  ): TreeOperationResponseDTO => {
    return measure('createNodeBelow', () => {
      TreeManager.instance.createNodeBelow(type, prefix, baseNodeId);
      const hasSessions = TreeManager.instance.getNFiles() > 0;
      WindowManager.instance.sendDataToMainWindow({
        where: [RefreshPlace.HOME_PAGE, RefreshPlace.PROFILE_STORE],
        hasSessions,
      });
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.getState,
  (_: IpcMainInvokeEvent, anchor: number): TreeOperationResponseDTO => {
    return measure('getState', () => TreeManager.instance.buildResult(anchor));
  }
);

ipcMain.handle(
  TreeChannels.toggleDirOpen,
  (_: IpcMainInvokeEvent, anchor: number, nodeId: string): TreeOperationResponseDTO => {
    return measure('toggleDirOpen', () => {
      TreeManager.instance.toggleDirOpen(nodeId);
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.renameNode,
  (_: IpcMainInvokeEvent, nodeId: string, newName: string): GenericResponseDTO => {
    return measure('renameNode', () => TreeManager.instance.renameNode(nodeId, newName));
  }
);

ipcMain.handle(
  TreeChannels.handleSelection,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    nodeId: string,
    keys: ModifierKeys
  ): TreeOperationResponseDTO => {
    return measure('handleSelection', () => {
      TreeManager.instance.handleSelection(nodeId, keys);
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.deleteNode,
  async (
    _: IpcMainInvokeEvent,
    anchor: number,
    nodeId: string
  ): Promise<TreeOperationResponseDTO> => {
    await sleep(2000);
    return measure('deleteNode', async () => {
      await TreeManager.instance.deleteNode(nodeId);
      const hasSessions = TreeManager.instance.getNFiles() > 0;
      const tags = TagsManager.instance.getTags();
      const { page, height, nFiltered } = CardsManager.instance.getCurrentPageRefreshed();
      WindowManager.instance.sendDataToMainWindow({
        where: [RefreshPlace.HOME_PAGE, RefreshPlace.FILTERS_STORE, RefreshPlace.PROFILE_STORE],
        filters: FiltersManager.instance.getFilters(),
        profileRegistry: ProfileManager.instance.getProfileRegistry(),
        hasSessions,
        tags,
        page,
        height,
        nFiltered,
      });
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.deleteSelectedNodes,
  async (_: IpcMainInvokeEvent, anchor: number): Promise<TreeOperationResponseDTO> => {
    await sleep(2000);
    return measure('deleteSelectedNodes', async () => {
      await TreeManager.instance.deleteSelectedNodes();
      const hasSessions = TreeManager.instance.getNFiles() > 0;
      const tags = TagsManager.instance.getTags();
      const { page, height, nFiltered } = CardsManager.instance.getCurrentPageRefreshed();
      WindowManager.instance.sendDataToMainWindow({
        where: [RefreshPlace.HOME_PAGE, RefreshPlace.FILTERS_STORE, RefreshPlace.PROFILE_STORE],
        filters: FiltersManager.instance.getFilters(),
        profileRegistry: ProfileManager.instance.getProfileRegistry(),
        hasSessions,
        tags,
        page,
        height,
        nFiltered,
      });
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.search,
  (_: IpcMainInvokeEvent, anchor: number, searchText: string): TreeOperationResponseDTO => {
    return measure('search', () => {
      TreeManager.instance.search(searchText);
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.collapseAll,
  (_: IpcMainInvokeEvent, anchor: number): TreeOperationResponseDTO => {
    return measure('collapseAll', () => {
      TreeManager.instance.collapseAll();
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.clearSelection,
  (_: IpcMainInvokeEvent, anchor: number): TreeOperationResponseDTO => {
    return measure('clearSelection', () => {
      TreeManager.instance.clearSelection();
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.selectAll,
  (_: IpcMainInvokeEvent, anchor: number): TreeOperationResponseDTO => {
    return measure('selectAll', () => {
      TreeManager.instance.selectAll();
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFilesAbove,
  (_: IpcMainInvokeEvent, anchor: number, baseNodeId: string): TreeOperationResponseDTO => {
    return measure('moveSelectedFilesAbove', () => {
      TreeManager.instance.moveSelectedFilesAbove(baseNodeId);
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFilesBelow,
  (_: IpcMainInvokeEvent, anchor: number, baseNodeId: string): TreeOperationResponseDTO => {
    return measure('moveSelectedFilesBelow', () => {
      TreeManager.instance.moveSelectedFilesBelow(baseNodeId);
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFoldersAbove,
  (_: IpcMainInvokeEvent, anchor: number, baseNodeId: string): TreeOperationResponseDTO => {
    return measure('moveSelectedFoldersAbove', () => {
      TreeManager.instance.moveSelectedFoldersAbove(baseNodeId);
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedFoldersBelow,
  (_: IpcMainInvokeEvent, anchor: number, nodeId: string): TreeOperationResponseDTO => {
    return measure('moveSelectedFoldersBelow', () => {
      TreeManager.instance.moveSelectedFoldersBelow(nodeId);
      return TreeManager.instance.buildResult(anchor);
    });
  }
);

ipcMain.handle(
  TreeChannels.moveSelectedNodesInto,
  (
    _: IpcMainInvokeEvent,
    anchor: number,
    destinationId: string | null
  ): TreeOperationResponseDTO => {
    return measure('moveSelectedNodesInto', () => {
      TreeManager.instance.moveSelectedNodesInto(destinationId);
      return TreeManager.instance.buildResult(anchor);
    });
  }
);
