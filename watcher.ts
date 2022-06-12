import * as fs from 'fs';
import * as path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import logger from './logger';
import { EventEmitter } from 'events';

export interface WatcherPromise {
  onAddDir: (notify: (addedFolderPath: string) => void) => void;
  close: () => void;
}

interface WatchPayload {
  folderPath: string;
  notificationMsg: string;
}

const watcherOptions: chokidar.WatchOptions = {
  depth: 0,
  persistent: true,
  followSymlinks: true,
  awaitWriteFinish: true,
  useFsEvents: true,
  usePolling: true,
  interval: 100,
};

export default class Watcher extends EventEmitter {
  private parentWatcher?: FSWatcher;
  private watcher?: FSWatcher;
  private dirs: Array<string> = [];

  constructor(
    private watchPayload: WatchPayload,
    private beforeStart: () => Promise<void>,
    private beforeClose: () => Promise<void>,
  ) {
    super();
    if (fs.existsSync(this.watchPayload.folderPath)) {
      this.dirs = fs.readdirSync(this.watchPayload.folderPath);
    }
  }

  init() {
    const self = this;
    return new Promise<WatcherPromise>(async (resolve, reject) => {
      try {
        await this.beforeStart();
        logger.info('start watching the folder.');
        self.watcher = chokidar.watch(
          self.watchPayload.folderPath,
          watcherOptions,
        );
        self.parentWatcher = chokidar.watch(
          path.dirname(self.watchPayload.folderPath),
          watcherOptions,
        );

        logger.info('start listening to remove directory event.');
        self.onRemove();

        self.watcher.on('ready', function onReady() {
          logger.info('the folder is successfully watched.');
          self.emit('watched');
          resolve({
            onAddDir: self.onAddDir.bind(self),
            close: self.close.bind(self),
          });
        });
      } catch (err) {
        this.emit('error', err);
      }
    });
  }

  private isValidToNotify(givenPath: string) {
    if (path.resolve(this.watchPayload.folderPath) === path.resolve(givenPath))
      return false;
    const name = path.basename(givenPath);
    return !this.dirs.includes(name);
  }

  private onAddDir(notify: (addedFolderPath: string) => void) {
    this.watcher!.on('addDir', (addedFolderPath: string) => {
      if (this.isValidToNotify(addedFolderPath)) {
        logger.info('new folder is added.', { folderPath: addedFolderPath });
        notify(addedFolderPath);
      }
    });
  }

  private onRemove() {
    this.watcher!.on('unlinkDir', (addedFolderPath: string) => {
      const name = path.basename(addedFolderPath);
      this.dirs = this.dirs.filter((dir) => dir !== name);
    });

    this.parentWatcher!.on('unlinkDir', (addedFolderPath: string) => {
      if (addedFolderPath === this.watchPayload.folderPath) {
        this.close();
      }
    });
  }

  private async close() {
    logger.info('closing the watcher.');
    try {
      await this.beforeClose();

      await this.watcher!.unwatch(this.watchPayload.folderPath).close();

      await this.parentWatcher!.close();

      logger.info('the watcher closed successfully.');
      this.emit('unwatched');
    } catch (error) {
      this.emit('error', error);
    }
  }
}
