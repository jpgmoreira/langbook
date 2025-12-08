import { EventEmitter } from '@common/events/eventEmitter';
import { Card, CARD_STATUSES, CardStatus } from '@common/schemas/card';
import { Events } from '@main/events/events';
import { CardsDbManager } from '@main/data/managers/cards/cardsDbManager';
import { FiltersManager } from '@main/data/managers/filtersManager';
import { extFromMime, genHash, shuffleArray } from '@common/utils/utils';
import { SessionsManager } from '@main/data/managers/sessionsManager';
import { TagsManager } from '@main/data/managers/tagsManager';
import { ProfileManager } from '@main/data/managers/profileManager';
import { DATA_DIR } from '@main/data/constants';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { WindowManager } from '@main/data/managers/windowManager';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { RefreshPlace } from '@common/types/refreshPlace';
import { isFileInsideDirectory } from '@main/data/utils';
import { GetNewCardResponseDTO } from '@common/dto/getNewCardResponseDTO';
import { TreeManager } from '@main/data/managers/treeManager';

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

  // Maps card statuses to all filtered cards that have that status:
  private cardsByStatus: Record<CardStatus, Card[]> = {
    review: [],
    normal: [],
    suspended: [],
  };

  // Maps card statuses to the index of the current card for the status:
  private cardStatusIndex: Record<CardStatus, number> = {
    review: 0,
    normal: 0,
    suspended: 0,
  };

  // Last status chosen:
  private lastStatusChosen = '';

  // Set with all card IDs for the current flashcards study.
  private cardsSeen = new Set<string>();

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

  public async loadFromDb(profileId: string) {
    await CardsDbManager.instance.loadProfile(profileId);
    const allCards = await CardsDbManager.instance.loadAllCards();
    for (const card of allCards) {
      this.cardsMap[card.id] = card;
    }
    this.refresh();
  }

  /**
   * Recomputes:
   *   - filtered;
   *   - sessionToCard;
   *   - cardsByStatus;
   *   - cardStatusIndex;
   * Based on "cardsMap" and the current filters.
   * Updates "cardsSeen".
   */
  public refresh() {
    this.filtered = [];
    this.sessionToCard = {};
    for (const status of CARD_STATUSES) {
      this.cardsByStatus[status] = [];
      this.cardStatusIndex[status] = 0;
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
        this.cardsByStatus[card.status].push(card);
      } else {
        // Remove cards that don't satisfy filters from cards seen
        this.cardsSeen.delete(card.id);
      }
    });
    this.filtered.sort((a, b) => a.createdAt - b.createdAt); // Ascending.
    for (const status of CARD_STATUSES) {
      shuffleArray(this.cardsByStatus[status]);
    }
  }

  private chooseStatus(): CardStatus {
    const rand = Math.random();
    const { reviewProbability, suspendedProbability } =
      ProfileManager.instance.getStatusProbabilities()!;
    if (rand < reviewProbability) return 'review';
    if (rand < reviewProbability + suspendedProbability) return 'suspended';
    return 'normal';
  }

  /**
   * Check if we can choose "status" as the status for the next card.
   * We cannot choose it in two situations:
   *  1. There are no cards with this status;
   *  2. There is only one card with this status and this is the last status chosen
   *      (to avoid repeating the same card twice in a row).
   */
  private canChooseStatus(status: CardStatus) {
    const cards = this.cardsByStatus[status];
    if (cards.length === 0) return false;
    if (cards.length === 1 && status === this.lastStatusChosen) return false;
    return true;
  }

  public getNextCard(): GetNewCardResponseDTO {
    if (this.filtered.length === 0) {
      return { card: null, nSeen: 0 };
    }
    if (this.filtered.length === 1) {
      return { card: this.filtered[0], nSeen: 1 };
    }
    const maxTries = 30;
    let status = this.chooseStatus();
    let tries = 0;
    while (!this.canChooseStatus(status) && tries < maxTries) {
      status = this.chooseStatus();
      tries++;
    }
    if (tries >= maxTries) {
      for (const s of CARD_STATUSES) {
        if (this.cardsByStatus[status].length > 0) {
          status = s;
          break;
        }
      }
    }
    this.lastStatusChosen = status;
    const cards = this.cardsByStatus[status];
    const index = ++this.cardStatusIndex[status] % cards.length;
    if (index === 0) {
      // Notice that after shuffling, the card can repeat once, if the last
      // card chosen ends up being the first card in the new shuffled array.
      shuffleArray(cards);
    }
    const card = cards[index];
    this.cardsSeen.add(card.id);
    return { card, nSeen: this.cardsSeen.size };
  }

  /**
   * Media files that come from the media input:
   *  - They can come with the full absolute path on the machine (if they are new files),
   *      or they can come with just the filename in the media folder (existing files).
   *  - All files from the card's media will be assigned just the filename in the media
   *      folder as the path.
   *
   * Image files that come from the RTE fields:
   *  - They can come as:
   *      1. base64 images;
   *      2. Urls;
   *      3. safe-file images (existing images).
   *  - All the images in the fields will be assigned as source just the filename in
   *      the media folder.
   */
  private async updateCardMedia(card: Card) {
    const profileId = ProfileManager.instance.getCurrProfile()!.id;
    const mediaDir = path.join(DATA_DIR, 'profileData', profileId, 'media');
    // 1. Update media from the media input:
    const mediaDelete: string[] = [];
    for (let i = 0; i < card.media.length; i++) {
      const media = card.media[i];
      // file already contained in the media: skip.
      if (fs.existsSync(path.join(mediaDir, media.path))) {
        continue;
      }
      // tried to copy a file from inside the media folder: remove.
      if (isFileInsideDirectory(mediaDir, media.path.replace('safe-file://', ''))) {
        mediaDelete.push(media.name);
        continue;
      }
      // if the file does not exist in the user's computer: remove.
      if (!fs.existsSync(media.path.replace('safe-file://', ''))) {
        mediaDelete.push(media.name);
        continue;
      }
      const ext = path.extname(media.name) ? '' : extFromMime(media.type);
      const mediaFile = `${card.createdAt}_${media.name}${ext}`;
      const newPath = path.join(mediaDir, mediaFile);
      fs.copyFileSync(media.path, newPath);
      media.path = mediaFile; // Store only file name in media folder.
    }
    card.media = card.media.filter((m) => !mediaDelete.includes(m.name));
    // 2. Update images from the rich-text editors:
    const $front = cheerio.load(card.front, null, false),
      $back = cheerio.load(card.back, null, false),
      $extra = cheerio.load(card.extra, null, false);
    const images = [...$front('img'), ...$back('img'), ...$extra('img')];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const src = image.attribs.src;
      const isSafeFile = src.startsWith('safe-file');
      const isBase64 = src.startsWith('data:image');
      const isUrl = src.startsWith('http');
      if (!isBase64 && !isUrl && !isSafeFile) {
        continue;
      }
      if (isSafeFile) {
        // Image already existed: just keep only the name as src.
        const baseName = path.basename(src);
        image.attribs.src = baseName;
        continue;
      }
      const hash = genHash(src, 10);
      const mediaFile = `${card.createdAt}_${hash}.png`;
      image.attribs.src = mediaFile; // Store only file name in media foder.
      const fPath = path.join(mediaDir, mediaFile);
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
      await CardsDbManager.instance.deleteCard(card.id);
      SessionsManager.instance.cardDeleted(oldCard);
      TagsManager.instance.cardDeleted(oldCard);
      for (const media of oldCard.media) {
        if (!card.media.some((m) => m.path === media.path)) {
          this.deleteMediaFile(media.path);
        }
      }
      // Delete images from the RTEs that are not present anymore.
      let $front = cheerio.load(card.front, null, false),
        $back = cheerio.load(card.back, null, false),
        $extra = cheerio.load(card.extra, null, false);
      const newImages = [...$front('img'), ...$back('img'), ...$extra('img')];
      $front = cheerio.load(oldCard.front, null, false);
      $back = cheerio.load(oldCard.back, null, false);
      $extra = cheerio.load(oldCard.extra, null, false);
      const oldImages = [...$front('img'), ...$back('img'), ...$extra('img')];
      for (const image of oldImages) {
        if (!newImages.some((i) => i.attribs.src === image.attribs.src)) {
          this.deleteMediaFile(image.attribs.src);
        }
      }
    } else {
      ProfileManager.instance.addCards(1);
    }
    // Update with new info.
    await CardsDbManager.instance.insertCard(card);
    SessionsManager.instance.cardCreated(card);
    TagsManager.instance.cardCreated(card);
    this.cardsMap[card.id] = card;
    // Send updates to main and flashcards windows:
    this.refresh();
    if (FiltersManager.instance.satisfyCurrentFilters(card)) {
      this.cardsSeen.add(card.id);
    }
    const { page, height, nFiltered } = this.getPage(this.scrollTop);
    const mainWindowData: RendererResponseDTO = {
      where: [
        RefreshPlace.HOME_PAGE,
        RefreshPlace.FILTERS_STORE,
        RefreshPlace.PROFILE_STORE_REGISTRY,
      ],
      profileRegistry: ProfileManager.instance.getProfileRegistry(),
      tags: TagsManager.instance.getTags(),
      filters: FiltersManager.instance.getFilters(),
      hasSessions: TreeManager.instance.getNFiles() > 0,
      page,
      height,
      nFiltered,
    };
    const flashcardsWindowData: RendererResponseDTO = {
      where: [RefreshPlace.FLASHCARDS_PAGE_UPDATE],
      nFiltered: this.filtered.length,
      nFilteredReview: this.cardsByStatus['review'].length,
      nFilteredSuspended: this.cardsByStatus['suspended'].length,
      nSeen: this.cardsSeen.size,
      card,
    };
    WindowManager.instance.sendDataToMainWindow(mainWindowData);
    WindowManager.instance.sendDataToFlashcardsWindow(flashcardsWindowData);
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
        await CardsDbManager.instance.updateCard(card);
      }
    }
    delete this.sessionToCard[sessionId];
  }

  // Do not send a message to the renderer here, because this method can
  // potentially be called for a large number of cards in a single request,
  // in the case where you are deleting a bunch of sessions.
  public async deleteCard(card: Card) {
    await CardsDbManager.instance.deleteCard(card.id);
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
    if (this.cardsSeen.has(card.id)) {
      this.cardsSeen.delete(card.id);
    }
  }

  public getNFiltered() {
    return this.filtered.length;
  }

  public getNFilteredReview() {
    return this.cardsByStatus['review'].length;
  }

  public getNFilteredSuspended() {
    return this.cardsByStatus['suspended'].length;
  }

  public getNSeen() {
    return this.cardsSeen.size;
  }

  public resetFlashcards() {
    this.cardsSeen.clear();
  }

  public clear() {
    this.scrollTop = 0;
    this.cardsMap = {};
    this.filtered = [];
    this.cardsByStatus = {
      review: [],
      normal: [],
      suspended: [],
    };
    this.cardStatusIndex = {
      review: 0,
      normal: 0,
      suspended: 0,
    };
    this.sessionToCard = {};
  }
}
