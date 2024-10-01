import { existsSync } from "fs";
import { join } from "path";
import * as ts from "typescript";
import { TypeScriptBinaryLoader } from "./typescript-loader";

export class TsConfigProvider {
  constructor(private readonly typescriptLoader: TypeScriptBinaryLoader) {}

  public getByConfigFilename(configFilename: string) {
    const configPath = join(process.cwd(), configFilename);
    if (!existsSync(configPath)) {
      throw new Error(
        `Could not find TypeScript configuration file "${configPath}". Please, ensure that you are running this command in the appropriate directory (inside Nest workspace).`
      );
    }
    const tsBinary = this.typescriptLoader.load();
    const parsedCmd = tsBinary.getParsedCommandLineOfConfigFile(
      configPath,
      undefined!,
      tsBinary.sys as unknown as ts.ParseConfigFileHost
    );
    const { options, fileNames, projectReferences } = parsedCmd!;
    return { options, fileNames, projectReferences };
  }
}
