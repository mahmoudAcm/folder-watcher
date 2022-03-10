import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';
import Notifier from 'node-notifier';

interface Watcher {
  folderPath: string;
  message: string;
  watcher: ReturnType<typeof chokidar.watch>;
}

class WatcherCenter {
  private watchers: Array<Watcher>;
  constructor() {
    this.watchers = [];
    const dbPath = path.join(__dirname, 'watchedFolders.json');
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify({ db: [] }));
    }
  }

  start() {
    this.watchers = [];
    const dbPath = path.join(__dirname, 'watchedFolders.json');
    const watchedFolders: Omit<Watcher, 'watcher'>[] = JSON.parse(
      fs.readFileSync(dbPath).toString(),
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

      createdWatcher.on('unlink', async (folderPath) => {
        oldFolderPaths = oldFolderPaths.filter((path) => folderPath !== path);
      });
    });
  }

  add(folderPath: string, message: string) {
    const watcher =
      this.get(folderPath) ||
      chokidar.watch(folderPath, {
        persistent: true,
        depth: 0,
      });

    this.watchers = [
      {
        folderPath,
        message,
        watcher,
      },
      ...this.watchers,
    ];

    const dbPath = path.join(__dirname, 'watchedFolders.json');
    let watchedFolders: Omit<Watcher, 'watcher'>[] = JSON.parse(
      fs.readFileSync(dbPath).toString(),
    ).db;

    watchedFolders = [{ folderPath, message }, ...watchedFolders];
    fs.writeFileSync(dbPath, JSON.stringify({ db: watchedFolders }));

    return watcher;
  }

  remove(folderPath: string) {
    const watcher = this.get(folderPath);
    if (watcher) {
      watcher.unwatch(folderPath);
      this.watchers = this.watchers.filter(
        (watcher) => watcher.folderPath !== folderPath,
      );

      const dbPath = path.join(__dirname, 'watchedFolders.json');
      let watchedFolders: Omit<Watcher, 'watcher'>[] = JSON.parse(
        fs.readFileSync(dbPath).toString(),
      ).db;

      watchedFolders = watchedFolders.filter(
        (folder) => folder.folderPath !== folderPath,
      );
      fs.writeFileSync(dbPath, JSON.stringify({ db: watchedFolders }));
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
    return this.watchers.map((watcher) => ({ folderPath: watcher.folderPath }));
  }
}

export default WatcherCenter;
