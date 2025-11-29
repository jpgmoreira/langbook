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

  private cardsMap: Record<string, Card> = {};
  private filtered: Card[] = [];
  private frequency: Record<number, Card[]> = {};
  private frequencyIndex: Record<number, number> = {};
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

  private refresh() {
    this.filtered = [];
    for (let i = 0; i <= 10; i++) {
      this.frequency[i] = [];
      this.frequencyIndex[i] = 0;
    }
    Object.values(this.cardsMap).forEach((card: Card) => {
      if (FiltersManager.instance.satisfyCurrentFilters(card)) {
        this.filtered.push(card);
        this.frequency[card.frequency].push(card);
      }
    });
    this.filtered.sort((a, b) => a.createdAt - b.createdAt);
    for (let i = 0; i <= 10; i++) {
      shuffleArray(this.frequency[i]);
    }
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

  public async upsertCard(card: Card) {
    // Delete old card info.
    if (card.id in this.cardsMap) {
      const oldCard = this.cardsMap[card.id];
      DbManager.instance.deleteCard(card.id);
      SessionsManager.instance.cardDeleted(card);
      TagsManager.instance.cardDeleted(card);
      for (const media of oldCard.media) {
        if (!card.media.some((m) => m.path === media.path)) {
          // TODO: make sure it works.
          fs.unlinkSync(media.path);
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
    this.refreshCardsView(false);
    // TODO: Check if flashcards window is open, and if it is, send newly updated card to it.
    WindowManager.instance.closeEditor();
  }

  private preparePage() {
    const page: Card[] = [];
    for (
      let i = this.anchor, j = 0;
      i < this.filtered.length && j < this.CARDS_PAGE_SIZE;
      i++, j++
    ) {
      page.push(this.filtered[i]);
    }
    const totalHeight = this.filtered.reduce((prev: number, curr: Card) => prev + curr.height, 0);
    return { page, totalHeight };
  }

  public refreshCardsView(resetAnchor: boolean) {
    this.refresh();
    if (resetAnchor) this.anchor = 0;
    const { page, totalHeight } = this.preparePage();
    console.log(totalHeight);
    WindowManager.instance.refreshCardsView(page, this.anchor, totalHeight);
  }

  public clear() {}
}
