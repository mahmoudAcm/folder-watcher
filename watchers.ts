import * as fs from 'fs';
import * as path from 'path';
import { Socket, Server } from 'socket.io';
import logger from './logger';
import { getAllFolders, addToDB, openFolder, removeFromDB } from './utils';
import Watcher, { WatcherPromise } from './watcher';

type Folder = { folderPath: string; notificationMsg: string };

export default function createFactory(io: Server) {
  const watchers = new Map<string, Promise<WatcherPromise>>();

  function watch(socket: Socket, folder: Folder) {
    const watcher = new Watcher(
      folder,
      () => addToDB(folder),
      () => removeFromDB(folder),
    );
    const WatcherPromise = watcher.init();
    watchers.set(folder.folderPath, WatcherPromise);

    watcher.on('error', (error) => {
      if ('message' in error) logger.error(error.message);
      else logger.error(JSON.stringify(error));
      socket.emit('error', error);
    });

    watcher.on('watched', async () => {
      io.emit('watched', {
        ...folder,
        timestamps: Date.now(),
        name: path.basename(folder.folderPath),
      });

      (await WatcherPromise).onAddDir(function (addedFolderPath) {
        socket.emit('notification', {
          title: addedFolderPath,
          message: folder.notificationMsg,
        });
      });
    });

    watcher.on('unwatched', () => {
      io.emit('unwatched', folder.folderPath, path.basename(folder.folderPath));
    });
  }

  async function unwatch(folderPath: string) {
    if (!watchers.has(folderPath)) return;
    const { close } = await watchers.get(folderPath)!;
    watchers.delete(folderPath);
    close();
  }

  async function resumeLastWork() {
    const folders = await getAllFolders();
    for (const folder of folders) {
      const watcher = new Watcher(
        folder,
        async () => {},
        () => removeFromDB(folder),
      );

      const WatcherPromise = watcher.init();
      watchers.set(folder.folderPath, WatcherPromise);

      watcher.on('error', (error) => {
        if ('message' in error) logger.error(error.message);
        else logger.error(JSON.stringify(error));
        io.emit('error', error);
      });

      watcher.on('unwatched', () => {
        io.emit(
          'unwatched',
          folder.folderPath,
          path.basename(folder.folderPath),
        );
      });

      (await WatcherPromise).onAddDir(function (addedFolderPath) {
        io.emit('notification', {
          title: addedFolderPath,
          message: folder.notificationMsg,
        });
      });
    }
  }

  return {
    resumeLastWork,
    watch,
    unwatch,
  };
}
