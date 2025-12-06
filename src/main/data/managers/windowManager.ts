import path, { join } from 'path';
import { Channels } from '@preload/channels';
import { BrowserWindow, Menu } from 'electron';
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { loadStartupData } from '../startup';
import { is } from '@electron-toolkit/utils';
import { TagsManager } from './tagsManager';
import { SessionsManager } from './sessionsManager';
import { Card } from '@common/schemas/card';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { RefreshPlace } from '@common/types/refreshPlace';
import { DATA_DIR } from '../constants';
import { ProfileManager } from './profileManager';
import { CardsManager } from './cardsManager';

/**
 * Singleton for managing application windows.
 * Access via WindowsManager.instance
 */
export class WindowManager {
  static #instance: WindowManager;

  private mainWindow!: BrowserWindow;
  private editorWindow!: BrowserWindow;
  private flashcardsWindow!: BrowserWindow;

  private readonly indexHtmlPath = join(__dirname, '../renderer/index.html');
  private readonly iconPath = join(__dirname, '../../../../build/icon.png');
  private readonly preloadPath = join(__dirname, '../preload/index.js');

  private readonly commonWindowConfig = Object.freeze({
    show: false,
    icon: this.iconPath,
    webPreferences: {
      preload: this.preloadPath,
      spellCheck: false,
    },
  });

  private constructor() {
    Menu.setApplicationMenu(null);
    if (is.dev) {
      installExtension(VUEJS_DEVTOOLS)
        .then((ext) => console.log(`Added Extension:  ${ext.name}`))
        .catch((err) => console.log('An error occurred: ', err));
    }
  }

  public static get instance(): WindowManager {
    if (!this.#instance) {
      this.#instance = new WindowManager();
    }
    return this.#instance;
  }

  private initWindow(window: BrowserWindow) {
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      window.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
      window.loadFile(this.indexHtmlPath);
    }
    if (is.dev) {
      window.webContents.openDevTools({ mode: 'right' });
    }
  }

  private createEditorWindow(): void {
    this.editorWindow = new BrowserWindow({
      ...this.commonWindowConfig,
      width: 1000,
      height: 740,
      parent: this.mainWindow,
      modal: true,
    });
    this.editorWindow.on('close', (e) => {
      e.preventDefault();
      this.editorWindow.hide();
      if (!this.flashcardsWindow.isVisible()) {
        this.mainWindow.webContents.send(Channels.closeBackdrop);
      }
    });
    this.initWindow(this.editorWindow);
  }

  private createFlashcardsWindow(): void {
    this.flashcardsWindow = new BrowserWindow({
      ...this.commonWindowConfig,
      width: 1000,
      height: 740,
      parent: this.mainWindow,
      modal: true,
    });
    this.flashcardsWindow.on('close', (e) => {
      e.preventDefault();
      this.flashcardsWindow.hide();
      this.mainWindow.webContents.send(Channels.closeBackdrop);
    });
    this.initWindow(this.flashcardsWindow);
  }

  public createMainWindow(): void {
    if (BrowserWindow.getAllWindows().length !== 0) return;
    this.mainWindow = new BrowserWindow({
      ...this.commonWindowConfig,
      width: 1200,
      height: 800,
    });
    this.mainWindow.once('ready-to-show', async () => {
      const startupData = await loadStartupData();
      this.mainWindow.webContents.send(Channels.startup, startupData);
      this.mainWindow.show();
    });
    this.initWindow(this.mainWindow);
    this.createEditorWindow();
    this.createFlashcardsWindow();
  }

  public openEditor(card: Card | null) {
    const profileId = ProfileManager.instance.getCurrProfile()!.id;
    const data: RendererResponseDTO = {
      where: [RefreshPlace.EDITOR_PAGE],
      card,
      tags: TagsManager.instance.getTags(),
      sessions: SessionsManager.instance.getSessions(),
      mediaDir: path.join(DATA_DIR, 'profileData', profileId, 'media'),
    };
    this.editorWindow.webContents.send(Channels.openEditor, data);
    this.editorWindow.show();
  }

  public openFlashcards() {
    const profileId = ProfileManager.instance.getCurrProfile()!.id;
    const data: RendererResponseDTO = {
      where: [RefreshPlace.FLASHCARDS_PAGE_INIT],
      nFiltered: CardsManager.instance.getNFiltered(),
      card: CardsManager.instance.getNextCard(),
      mediaDir: path.join(DATA_DIR, 'profileData', profileId, 'media'),
      sessions: SessionsManager.instance.getSessions(),
    };
    this.flashcardsWindow.webContents.send(Channels.openFlashcards, data);
    this.flashcardsWindow.show();
  }

  public closeEditor() {
    this.editorWindow.close();
  }

  public sendDataToMainWindow(data: RendererResponseDTO) {
    this.mainWindow.webContents.send(Channels.refreshData, data);
    if (!this.flashcardsWindow.isVisible()) {
      this.closeEditor();
    }
  }

  public sendDataToFlashcardsWindow(data: RendererResponseDTO) {
    this.flashcardsWindow.webContents.send(Channels.refreshData, data);
  }

  public cardWasDeleted(data: RendererResponseDTO) {
    this.sendDataToMainWindow(data);
  }
}
