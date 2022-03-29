import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';
import { WindowsBalloon } from 'node-notifier';
import File from './File';

const Notifier = new WindowsBalloon();

interface Options {
  parentFolder: string;
  openFolder: boolean;
}

interface Watcher {
  folderPath: string;
  message: string;
  createdAt: Date;
  options: Options;
  watcher: ReturnType<typeof chokidar.watch>;
}

class WatcherCenter {
  private watchers: Array<Omit<Watcher, 'options'>>;
  private file: File;
  private optionsMap: Map<string, Options>;

  constructor() {
    this.watchers = [];
    const dbPath = path.join(__dirname, 'watchedFolders.json');
    this.file = new File(dbPath);

    this.optionsMap = new Map();
    const __db: Array<Omit<Watcher, 'watcher'>> = JSON.parse(
      this.file.content,
    ).db;

    __db.forEach(({ options, folderPath }) => {
      this.addOptions(folderPath, options);
    });
  }

  start() {
    const watchedFolders: Omit<Watcher, 'watcher'>[] = JSON.parse(
      this.file.content,
    ).db;

    watchedFolders.forEach((folder) => {
      const createdWatcher = this.add(
        folder.folderPath,
        folder.message,
        folder.options,
      );

      let oldFolderPaths = fs
        .readdirSync(folder.folderPath)
        .map((dir) => path.join(folder.folderPath, dir));

      createdWatcher.on('addDir', async (folderPath) => {
        if (!oldFolderPaths.includes(folderPath)) {
          Notifier.notify(
            {
              message: folder.message,
              title: folderPath.split('\\').reverse()[0],
              type: 'warn',
              wait: true,
              sound: true,
            },
            (...args: unknown[]) => {
              const actionType = args[1];
              const __array = folderPath.split('\\');
              const parentFolder = __array
                .slice(0, __array.length - 1)
                .join('\\');

              const options = this.getOptions(parentFolder);
              if (
                actionType === 'activate' &&
                options.openFolder &&
                folderPath.includes(parentFolder)
              ) {
                require('child_process').exec(`start "" "${folderPath}"`);
              }
            },
          );
          oldFolderPaths.push(folderPath);
        }
      });

      createdWatcher.on('unlinkDir', async (folderPath) => {
        oldFolderPaths = oldFolderPaths.filter((path) => folderPath !== path);
      });
    });
  }

  addOptions(folderPath: string, options: Options) {
    this.optionsMap.set(folderPath, { ...options, parentFolder: folderPath });
  }

  removeOptions(folderPath: string) {
    this.optionsMap.delete(folderPath);
  }

  getOptions(folderPath: string) {
    return (
      this.optionsMap.get(folderPath) || {
        openFolder: false,
        parentFolder: '',
      }
    );
  }

  add(folderPath: string, message: string, options: Options) {
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
      this.addOptions(folderPath, options);
      watchedFolders = [
        {
          folderPath,
          message,
          createdAt: __watcher.createdAt,
          options: { ...options, parentFolder: folderPath },
        },
        ...watchedFolders,
      ];
      this.file.content = JSON.stringify({ db: watchedFolders });
    }

    return watcher;
  }

  remove(folderPath: string) {
    const watcher = this.get(folderPath);
    this.removeOptions(folderPath);

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
