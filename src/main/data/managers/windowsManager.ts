import { BrowserWindow } from 'electron';

/**
 * Singleton for managing application windows.
 * Access via WindowsManager.instance
 */
export class WindowsManager {
  static #instance: WindowsManager;

  private mainWindow!: BrowserWindow;
  private addCardWindow!: BrowserWindow;

  private constructor() {}

  public static get instance(): WindowsManager {
    if (!this.#instance) {
      this.#instance = new WindowsManager();
    }
    return this.#instance;
  }

  public setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
    this.addCardWindow = new BrowserWindow({ parent: this.mainWindow, modal: true, show: false });

    this.addCardWindow.on('close', (e) => {
      e.preventDefault();
      this.addCardWindow.hide();
    });
  }

  public openAddCard() {
    this.addCardWindow.show();
  }
}
