import * as fs from 'fs';
import * as path from 'path';
import childProcess from 'child_process';

const DBPath = path.join(__dirname, 'db.json');

export async function getAllFolders() {
  if (!fs.existsSync(DBPath)) {
    fs.writeFileSync(DBPath, '[]');
  }

  return JSON.parse(fs.readFileSync(DBPath).toString()) as Array<any>;
}

export async function addToDB(data: any) {
  const db = await getAllFolders();
  return new Promise<void>((resolve, reject) => {
    if (!fs.existsSync(data.folderPath)) {
      return reject({
        folderPath: true,
        message: 'This path is not found on your device.',
      });
    }

    if (
      db.some(
        (item) => item.folderPath.split('\\').join('\\') === data.folderPath,
      )
    ) {
      return reject({
        folderPath: true,
        message: 'This path is already watched.',
      });
    }

    db.push({ ...data, timestamps: Date.now() });
    fs.writeFile(DBPath, JSON.stringify(db), function callback(error) {
      if (error) return reject(error);
      resolve();
    });
  });
}

export async function removeFromDB(data: any) {
  let db = await getAllFolders();
  db = db.filter((item) => item.folderPath !== data.folderPath);

  return new Promise<void>((resolve, reject) => {
    fs.writeFile(DBPath, JSON.stringify(db), function callback(error) {
      if (error) return reject(error);
      resolve();
    });
  });
}

export function openFolder(
  folderPath: string,
  callback: (error: childProcess.ExecException | null) => void,
) {
  childProcess.exec(`start "" "${folderPath}"`, callback);
}
