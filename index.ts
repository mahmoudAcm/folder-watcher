import express from 'express';
import * as path from 'path';
import { isFreePort } from 'find-free-ports';
import http from 'http';
import logger from './logger';

async function startApp() {
  logger.info('starting the application...');
  const randomPort = await (() => {
    return new Promise<number>(async (resolve) => {
      for (let port = 3000; port <= 5000; port++) {
        if (await isFreePort(port)) {
          return resolve(port);
        }
      }
    });
  })();

  const PORT = parseInt(process.env.PORT as string, 10) || randomPort;
  return new Promise<http.Server>((resolve) => {
    const app = express();
    const server = http.createServer(app);

    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../public')));

    server.listen(PORT, () => {
      console.log('server is running on host `http://localhost:' + PORT + '`.');
      logger.info('the application started successfully.');
      resolve(server);
    });
  });
}

export default startApp;
