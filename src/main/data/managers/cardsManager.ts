import { EventEmitter } from '@common/events/eventEmitter';
import { Card, MediaFile } from '@common/schemas/card';
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
import { RequestPageDTO } from '@common/dto/requestPageDTO';

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

  // Current cards view anchor.
  // Necessary because when editing, adding or deleting a card I need to notify
  //   the main window about the change, so I need to store the anchor here.
  private anchor = 0;

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
    this.anchor = Math.min(this.anchor, Math.max(this.filtered.length - this.CARDS_PAGE_SIZE, 0));
  }

  private async updateCardMedia(card: Card) {
    const profileId = ProfileManager.instance.getCurrProfile()!.id;
    const mediaDir = path.join(DATA_DIR, 'profileData', profileId, 'media');
    // 1. Update media from the media input:
    const mediaDelete: string[] = [];
    for (let i = 0; i < card.media.length; i++) {
      const media = card.media[i];
      // if the file path already points to mediaDir, ignore.
      if (!path.relative(mediaDir, path.dirname(media.path.replace('safe-file://', '')))) continue;
      if (!fs.existsSync(media.path.replace('safe-file://', ''))) mediaDelete.push(media.name);
      else {
        const ext = path.extname(media.name) ? '' : extFromMime(media.type);
        const mediaFile = `${card.createdAt}_${media.name}${ext}`;
        const newPath = path.join(mediaDir, mediaFile);
        fs.copyFileSync(media.path, newPath);
        media.path = `safe-file://${newPath}`;
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
      const fPath = path.join(mediaDir, `${card.createdAt}_${hash}.png`);
      image.attribs.src = `safe-file://${fPath}`;
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

  private deleteMediaFile(path: string) {
    const filePath = path.replace('safe-file://', '');
    const realPath = decodeURIComponent(filePath);
    try {
      fs.unlinkSync(realPath);
    } catch {}
  }

  public async upsertCard(card: Card) {
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
    await this.updateCardMedia(card);
    await DbManager.instance.insertCard(card);
    SessionsManager.instance.cardCreated(card);
    TagsManager.instance.cardCreated(card);
    this.cardsMap[card.id] = card;
    // Send updated page to renderer:
    this.sendCurrentPageToRenderer();
    WindowManager.instance.sendTagsToRenderer();
    // TODO: Check if flashcards window is open, and if it is, send newly updated card to it.
    WindowManager.instance.closeEditor();
  }

  /**
   * This method is used both when sending a notification to the renderer without previous
   *   request, or when responding an invoke that was initiated by the renderer.
   */
  public getPage(anchor: number): RequestPageDTO {
    this.anchor = anchor;
    const page: Card[] = [];
    for (let i = anchor, j = 0; i < this.filtered.length && j < this.CARDS_PAGE_SIZE; i++, j++) {
      page.push(this.filtered[i]);
    }
    const height = this.filtered.reduce((prev: number, curr: Card) => prev + curr.height, 0);
    return { page, height, anchor };
  }

  public sendCurrentPageToRenderer() {
    this.refresh();
    const data = this.getPage(this.anchor);
    WindowManager.instance.sendPageToRenderer(data);
  }

  public async sessionDeleted(sessionId: string) {
    if (!(sessionId in this.sessionToCard)) return;
    const cards = this.sessionToCard[sessionId];
    for (const card of cards) {
      if (card.sessions.length === 1) {
        await this.deleteCard(card);
      }
    }
    delete this.sessionToCard[sessionId];
  }

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
    delete this.cardsMap[card.id];
  }

  public clear() {
    this.anchor = 0;
    this.cardsMap = {};
    this.filtered = [];
    this.frequency = {};
    this.sessionToCard = {};
  }
}
