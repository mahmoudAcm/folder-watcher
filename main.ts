import * as fs from 'fs';
import * as path from 'path';
import { Server, Socket } from 'socket.io';
import createFactory from './watchers';
import startApp from '.';
import { getAllFolders, openFolder } from './utils';
import logger from './logger';

(async () => {
  const server = await startApp();
  const io = new Server(server);

  const watchers = createFactory(io);

  await watchers.resumeLastWork();

  async function handleConnection(socket: Socket) {
    socket.emit('connection');

    socket.on('folders', async () => {
      socket.emit(
        'folders',
        (await getAllFolders()).map((data) => ({
          ...data,
          name: path.basename(data.folderPath),
        })),
      );
    });

    socket.on('watch', (args) => {
      watchers.watch(socket, args);
    });

    socket.on('unwatch', (args) => {
      watchers.unwatch(args);
    });

    socket.on('open', function onOpen(folderPath) {
      if (!fs.existsSync(folderPath)) {
        return socket.emit('error', {
          message: 'this path is not found on your device.',
        });
      }

      openFolder(folderPath, (error) => {
        if (error) {
          if ('message' in error) logger.error(error.message);
          else logger.error(JSON.stringify(error));
          return socket.emit('error', error);
        }

        socket.emit('folderOpened', path.basename(folderPath));
      });
    });
  }

  function handleDisconnect(socket: Socket) {
    socket.emit('disconnect');
  }

  io.on('connection', handleConnection);
  io.on('disconnect', handleDisconnect);

  function reportError(reason: Error | unknown) {
    logger.error(JSON.stringify(reason));
  }

  process.on('uncaughtException', reportError);
  process.on('unhandledRejection', reportError);
})();
