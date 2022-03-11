import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { watcher } from '.';
import Notifier from 'node-notifier';

const router = Router();

router.post('/watch', (req, res) => {
  const { folderPath, message } = req.body;
  if (watcher.includes(folderPath)) {
    res.json({
      type: 'warning',
      message: 'this folder path is already watched.',
    });
    return;
  }

  if (!fs.existsSync(folderPath)) {
    res.json({
      type: 'danger',
      message: 'something went wrong check the path again.',
    });
    return;
  }

  let oldFolderPaths = fs
    .readdirSync(folderPath)
    .map((dir) => path.join(folderPath, dir));

  const createdWatcher = watcher.add(folderPath, message);

  createdWatcher.on('addDir', async (folderPath) => {
    if (!oldFolderPaths.includes(folderPath)) {
      Notifier.notify({
        message: message,
        title: folderPath.split('\\').reverse()[0],
      });
      oldFolderPaths.push(folderPath);
    }
  });

  createdWatcher.on('unlink', async (folderPath) => {
    oldFolderPaths = oldFolderPaths.filter((path) => folderPath !== path);
  });

  res.json({
    type: 'success',
    message: 'folder watched successfuly.',
    payload: watcher.watchedFolders,
  });
});

export default router;
