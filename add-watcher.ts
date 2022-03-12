import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { watcher } from '.';
import Notifier from 'node-notifier';

const router = Router();

router.post('/watch', (req, res) => {
  const { folderPath, message, options } = req.body;
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

  const createdWatcher = watcher.add(folderPath, message, options);

  createdWatcher.on('addDir', async (folderPath) => {
    if (!oldFolderPaths.includes(folderPath)) {
      Notifier.notify(
        {
          message: message,
          title: folderPath.split('\\').reverse()[0],
        },
        (...args: unknown[]) => {
          const __array = folderPath.split('\\');
          const parentFolder = __array.slice(0, __array.length - 1).join('\\');

          const options = watcher.getOptions(parentFolder);
          if (options.openFolder && folderPath.includes(parentFolder)) {
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

  res.json({
    type: 'success',
    message: 'folder watched successfuly.',
    payload: watcher.watchedFolders,
  });
});

export default router;
