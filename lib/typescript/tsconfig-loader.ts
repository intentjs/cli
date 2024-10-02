import { dirname } from "path";
import * as ts from "typescript";

export class TsConfigLoader {
  load(): Record<string, any> {
    const configPath = this.loadPath();

    if (!configPath) {
      throw new Error("Could not find a valid 'tsconfig.json'.");
    }

    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      dirname(configPath)
    );

    return {
      compilerOptions: parsedConfig.options,
      include: parsedConfig.fileNames,
      exclude: parsedConfig.wildcardDirectories
        ? Object.keys(parsedConfig.wildcardDirectories)
        : undefined,
      includeDirs: parsedConfig.raw.include,
    };
  }

  loadPath(): string {
    return ts.findConfigFile(
      process.cwd(),
      ts.sys.fileExists,
      "tsconfig.json"
    ) as string;
  }
}
