import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import fp from 'find-free-port';

import addWatcherRouter from './add-watcher';
import removeWatcherRouter from './remove-watcher';
import WatcherCenter from './watcher';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(addWatcherRouter);
app.use(removeWatcherRouter);

export const watcher = new WatcherCenter();

app.get('/data', (req, res) => {
  res.json({ watchedFolders: watcher.watchedFolders });
});

fp(PORT, '127.0.0.1', function (err: unknown, freePort: number) {
  app.listen(freePort, () => {
    console.log(
      'server is running on port `http://localhost:' + freePort + '`.',
    );
    watcher.start();
  });
});
