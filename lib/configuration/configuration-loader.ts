import { readFileSync } from "fs";
import { ConfigurationInterface } from "./interface";
import { join } from "path";

export class ConfigurationLoader {
  load(filePath: string): ConfigurationInterface {
    const buffer = readFileSync(filePath).toString();
    return JSON.parse(buffer);
  }

  getFilePath(path?: string) {
    return path || join(process.cwd(), "intent.config.json");
  }
}
