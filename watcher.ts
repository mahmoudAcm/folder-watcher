import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';
import Notifier from 'node-notifier';
import File from './File';

interface Watcher {
  folderPath: string;
  message: string;
  createdAt: Date;
  watcher: ReturnType<typeof chokidar.watch>;
}

class WatcherCenter {
  private watchers: Array<Watcher>;
  private file: File;

  constructor() {
    this.watchers = [];
    const dbPath = path.join(__dirname, 'watchedFolders.json');
    this.file = new File(dbPath);
  }

  start() {
    const watchedFolders: Omit<Watcher, 'watcher'>[] = JSON.parse(
      this.file.content,
    ).db;

    watchedFolders.forEach((folder) => {
      const createdWatcher = this.add(folder.folderPath, folder.message);

      let oldFolderPaths = fs
        .readdirSync(folder.folderPath)
        .map((dir) => path.join(folder.folderPath, dir));

      createdWatcher.on('addDir', async (folderPath) => {
        if (!oldFolderPaths.includes(folderPath)) {
          Notifier.notify({
            message: folder.message,
            title: folderPath.split('\\').reverse()[0],
          });
          oldFolderPaths.push(folderPath);
        }
      });

      createdWatcher.on('unlinkDir', async (folderPath) => {
        oldFolderPaths = oldFolderPaths.filter((path) => folderPath !== path);
      });
    });
  }

  add(folderPath: string, message: string) {
    const watcher = chokidar.watch(folderPath, {
      persistent: true,
      depth: 0,
    });

    if (this.includes(folderPath)) this.get(folderPath)!;

    const __watcher = {
      folderPath,
      message,
      watcher,
      createdAt: new Date(),
    };

    this.watchers = [__watcher, ...this.watchers];

    let watchedFolders: Omit<Watcher, 'watcher'>[] = JSON.parse(
      this.file.content,
    ).db;

    if (!watchedFolders.some((folder) => folder.folderPath === folderPath)) {
      watchedFolders = [
        { folderPath, message, createdAt: __watcher.createdAt },
        ...watchedFolders,
      ];
      this.file.content = JSON.stringify({ db: watchedFolders });
    }

    return watcher;
  }

  remove(folderPath: string) {
    const watcher = this.get(folderPath);
    if (watcher) {
      watcher.unwatch(folderPath);
      this.watchers = this.watchers.filter(
        (watcher) => watcher.folderPath !== folderPath,
      );

      let watchedFolders: Omit<Watcher, 'watcher'>[] = JSON.parse(
        this.file.content,
      ).db;

      watchedFolders = watchedFolders.filter(
        (folder) => folder.folderPath !== folderPath,
      );
      this.file.content = JSON.stringify({ db: watchedFolders });
    }
  }

  includes(folderPath: string) {
    return this.watchers.some((watcher) => watcher.folderPath === folderPath);
  }

  get(folderPath: string) {
    return this.watchers.find((watcher) => watcher.folderPath === folderPath)
      ?.watcher;
  }

  get watchedFolders() {
    return this.watchers.map(({ watcher, ...__watcher }) => __watcher);
  }
}

export default WatcherCenter;
