import { Router } from 'express';
import { watcher } from '.';

const router = Router();

router.delete('/unwatch', (req, res) => {
  watcher.remove(req.body.folderPath);
  res.json({ type: 'success', message: 'folder is unwatched successfuly.' });
});

export default router;
