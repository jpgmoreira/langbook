import { EventEmitter } from '@common/events/eventEmitter';
import { Card } from '@common/schemas/card';
import { Events } from '@main/events/events';
import { DbManager } from './dbManager';
import { FiltersManager } from './filtersManager';
import { extFromMime, genHash, shuffleArray } from '@common/utils/utils';
import { SessionsManager } from './sessionsManager';
import { TagsManager } from './tagsManager';
import { ProfileManager } from './profileManager';
import { DATA_DIR } from '../constants';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { WindowManager } from './windowManager';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { RefreshPlace } from '@common/types/refreshPlace';

EventEmitter.instance.on(Events.clearProfileData, () => {
  CardsManager.instance.clear();
});

/**
 * Singleton for managing cards.
 * Access via CardsManager.instance
 */
export class CardsManager {
  static #instance: CardsManager;

  private readonly CARDS_PAGE_SIZE = 100;

  // Maps card ids to actual card objects:
  private cardsMap: Record<string, Card> = {};

  // Maps session ids to a list of all cards that are in the session:
  private sessionToCard: Record<string, Card[]> = {};

  // All cards that satisfy the current filters:
  private filtered: Card[] = [];

  // Maps frequency numbers to all filtered cards that have that frequency:
  private frequency: Record<number, Card[]> = {};

  // Current cards view scroll top.
  // I need it here, because a new page can be sent to the main window through an
  //  operation via the editor window. In this case the flow does not start from
  //  the main window so I can't receive the scroll top from it.
  private scrollTop = 0;

  private constructor() {}

  public static get instance(): CardsManager {
    if (!this.#instance) {
      this.#instance = new CardsManager();
    }
    return this.#instance;
  }

  public async loadFromDb() {
    // DbManager must have already been initialized.
    const allCards = await DbManager.instance.loadAllCards();
    for (const card of allCards) {
      this.cardsMap[card.id] = card;
    }
    this.refresh();
  }

  /**
   * Recompute "filtered", "frequency" and "sessionToCard" based on "cardsMap" and the current filters.
   */
  public refresh() {
    this.filtered = [];
    this.sessionToCard = {};
    for (let i = 0; i <= 10; i++) {
      this.frequency[i] = [];
    }
    Object.values(this.cardsMap).forEach((card: Card) => {
      for (const session of card.sessions) {
        if (!(session in this.sessionToCard)) {
          this.sessionToCard[session] = [];
        }
        this.sessionToCard[session].push(card);
      }
      if (FiltersManager.instance.satisfyCurrentFilters(card)) {
        this.filtered.push(card);
        this.frequency[card.frequency].push(card);
      }
    });
    this.filtered.sort((a, b) => a.createdAt - b.createdAt); // Ascending.
    for (let i = 0; i <= 10; i++) {
      shuffleArray(this.frequency[i]);
    }
  }

  /**
   * For both the media input and images in the RTE fields:
   *  - We receive the full paths for the files here.
   *  - In this method we copy the files to the media folder and adjust the
   *      paths to contain only the name of the file in the media folder.
   */
  private async updateCardMedia(card: Card) {
    const profileId = ProfileManager.instance.getCurrProfile()!.id;
    const mediaDir = path.join(DATA_DIR, 'profileData', profileId, 'media');
    // 1. Update media from the media input:
    const mediaDelete: string[] = [];
    for (let i = 0; i < card.media.length; i++) {
      const media = card.media[i];
      // if the file path already points to mediaDir, ignore.
      if (fs.existsSync(path.join(mediaDir, media.path))) continue;
      // if the file does not exist in the user's computer: remove.
      if (!fs.existsSync(media.path.replace('safe-file://', ''))) mediaDelete.push(media.name);
      else {
        const ext = path.extname(media.name) ? '' : extFromMime(media.type);
        const mediaFile = `${card.createdAt}_${media.name}${ext}`;
        const newPath = path.join(mediaDir, mediaFile);
        fs.copyFileSync(media.path, newPath);
        media.path = mediaFile; // Store only file name in media folder.
      }
    }
    card.media = card.media.filter((m) => !mediaDelete.includes(m.name));
    // 2. Update images from the rich-text editors:
    const $front = cheerio.load(card.front, null, false),
      $back = cheerio.load(card.back, null, false),
      $extra = cheerio.load(card.extra, null, false);
    const images = [...$front('img'), ...$back('img'), ...$extra('img')];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      let src = image.attribs.src;
      const isBase64 = src.startsWith('data:image');
      const isUrl = src.startsWith('http');
      if (!isBase64 && !isUrl) continue;
      const hash = genHash(src, 10);
      const mediaFile = `${card.createdAt}_${hash}.png`;
      const fPath = path.join(mediaDir, mediaFile);
      image.attribs.src = mediaFile; // Store only file name in media foder.
      if (fs.existsSync(fPath)) continue;
      let buffer: Buffer;
      if (isUrl) {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        const base64 = src.slice(src.indexOf(';base64,') + ';base64,'.length);
        buffer = Buffer.from(base64, 'base64');
      }
      const pngBuffer = await sharp(buffer).png().toBuffer();
      fs.writeFileSync(fPath, pngBuffer);
    }
    // Necessary to update the src in the images in the fields:
    card.front = $front.html();
    card.back = $back.html();
    card.extra = $extra.html();
  }

  private deleteMediaFile(base: string) {
    const profileId = ProfileManager.instance.getCurrProfile()!.id;
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'media', base);
    try {
      fs.unlinkSync(filePath);
    } catch {
      console.log('- Error deleting file:', filePath);
    }
  }

  public async upsertCard(card: Card) {
    await this.updateCardMedia(card);
    // Delete old card info.
    if (card.id in this.cardsMap) {
      const oldCard = this.cardsMap[card.id];
      await DbManager.instance.deleteCard(card.id);
      SessionsManager.instance.cardDeleted(oldCard);
      TagsManager.instance.cardDeleted(oldCard);
      for (const media of oldCard.media) {
        if (!card.media.some((m) => m.path === media.path)) {
          this.deleteMediaFile(media.path);
        }
      }
    } else {
      ProfileManager.instance.addCards(1);
    }
    // Update with new info.
    await DbManager.instance.insertCard(card);
    SessionsManager.instance.cardCreated(card);
    TagsManager.instance.cardCreated(card);
    this.cardsMap[card.id] = card;
    // Send updates to main window:
    this.refresh();
    const { page, height, nFiltered } = this.getPage(this.scrollTop);
    const data: RendererResponseDTO = {
      where: [RefreshPlace.HOME_PAGE, RefreshPlace.FILTERS_STORE, RefreshPlace.PROFILE_STORE],
      profileRegistry: ProfileManager.instance.getProfileRegistry(),
      tags: TagsManager.instance.getTags(),
      filters: FiltersManager.instance.getFilters(),
      page,
      height,
      nFiltered,
    };
    WindowManager.instance.sendDataToMainWindow(data);
    // TODO: Check if flashcards window is open, and if it is, send newly updated card to it.
    WindowManager.instance.closeEditor();
  }

  public getPage(scrollTop: number) {
    this.scrollTop = scrollTop;
    const page: Card[] = [];
    let height = 0;
    let anchorIndex = 0;
    let totalScroll = 0;
    let hasSetAnchor = false;
    for (let i = 0; i < this.filtered.length; i++) {
      const card = this.filtered[i];
      height += card.height;
      card.index = i;
      card.scrollTop = totalScroll;
      totalScroll += 40 + card.height;
      if (totalScroll > scrollTop && !hasSetAnchor) {
        anchorIndex = i;
        hasSetAnchor = true;
      }
    }
    if (!hasSetAnchor) {
      anchorIndex = this.filtered.length - 1;
    }
    const half = Math.floor(this.CARDS_PAGE_SIZE / 2);
    const first = Math.max(0, anchorIndex - half);
    const last = Math.min(this.filtered.length - 1, anchorIndex + half);
    for (let i = first; i <= last; i++) {
      page.push(this.filtered[i]);
    }
    const nFiltered = this.filtered.length;
    return { page, height, nFiltered };
  }

  public getCurrentPageRefreshed() {
    this.refresh();
    return this.getPage(this.scrollTop);
  }

  public async sessionDeleted(sessionId: string) {
    if (!(sessionId in this.sessionToCard)) return;
    const cards = this.sessionToCard[sessionId];
    for (const card of cards) {
      card.sessions = card.sessions.filter((s) => s !== sessionId);
      if (card.sessions.length === 0) {
        await this.deleteCard(card);
      } else {
        await DbManager.instance.updateCard(card);
      }
    }
    delete this.sessionToCard[sessionId];
  }

  // Do not send a message to the renderer here, because this method can
  // potentially be called to a large number of cards in a single call,
  // in the case where you are deleting a bunch of sessions.
  public async deleteCard(card: Card) {
    await DbManager.instance.deleteCard(card.id);
    TagsManager.instance.cardDeleted(card);
    SessionsManager.instance.cardDeleted(card);
    ProfileManager.instance.addCards(-1);
    for (const media of card.media) {
      this.deleteMediaFile(media.path);
    }
    const $front = cheerio.load(card.front, null, false),
      $back = cheerio.load(card.back, null, false),
      $extra = cheerio.load(card.extra, null, false);
    const images = [...$front('img'), ...$back('img'), ...$extra('img')];
    for (const image of images) {
      const src = image.attribs.src;
      this.deleteMediaFile(src);
    }
    for (const session of card.sessions) {
      this.sessionToCard[session] = this.sessionToCard[session].filter((c) => c !== card);
    }
    delete this.cardsMap[card.id];
  }

  public clear() {
    this.scrollTop = 0;
    this.cardsMap = {};
    this.filtered = [];
    this.frequency = {};
    this.sessionToCard = {};
  }
}
