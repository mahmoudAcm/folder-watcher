import * as fs from 'fs';

class File {
  constructor(private path: string) {
    if (!fs.existsSync(path))
      fs.writeFileSync(path, JSON.stringify({ db: [] }));
  }

  get content() {
    return fs.readFileSync(this.path).toString();
  }

  set content(data: string) {
    fs.writeFileSync(this.path, data);
  }
}

export default File;
