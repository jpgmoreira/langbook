import { Channels } from './channels';
import { TreeChannels } from './treeChannels';

export const allowedSendChannels = Object.freeze([Channels.cancelCardEdit] as const);
export const allowedInvokeChannels = Object.freeze([
  Channels.createProfile,
  Channels.renameProfile,
  Channels.deleteProfile,
  Channels.login,
  Channels.openEditor,
  Channels.upsertCard,
  // Channels to perform treeview operations:
  TreeChannels.createNode,
  TreeChannels.createNodeAbove,
  TreeChannels.createNodeBelow,
  TreeChannels.getState,
  TreeChannels.toggleDirOpen,
  TreeChannels.renameNode,
  TreeChannels.handleSelection,
  TreeChannels.deleteNode,
  TreeChannels.deleteSelectedNodes,
  TreeChannels.search,
  TreeChannels.collapseAll,
  TreeChannels.clearSelection,
  TreeChannels.selectAll,
  TreeChannels.moveSelectedFilesAbove,
  TreeChannels.moveSelectedFilesBelow,
  TreeChannels.moveSelectedFoldersAbove,
  TreeChannels.moveSelectedFoldersBelow,
  TreeChannels.moveSelectedNodesInto,
] as const);
export const allowedOnChannels = Object.freeze([
  Channels.loadStartupData,
  Channels.openEditor,
  Channels.closeEditor,
] as const);

export interface ElectronAPI {
  send: (channel: (typeof allowedSendChannels)[number], ...data: any[]) => void;
  invoke: <T = void>(channel: (typeof allowedInvokeChannels)[number], ...data: any[]) => Promise<T>;
  on: (channel: (typeof allowedOnChannels)[number], func: (...args: any[]) => void) => void;
}
