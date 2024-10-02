import * as ts from "typescript";
import { join } from "path";
import { existsSync } from "fs";
import { spawn } from "child_process";
import * as killProcess from "tree-kill";
import { ConfigurationLoader } from "../lib/configuration/configuration-loader";
import { ConfigurationInterface } from "../lib/configuration/interface";
import { ExtraOptions } from "../lib/interfaces";
import { defaultSwcOptionsFactory } from "../lib/swc/default-options";
import { SwcFileTransformer } from "../lib/swc/swc-file-transformer";
import { TsConfigLoader } from "../lib/typescript/tsconfig-loader";
import { isTruthy } from "../lib/utils/helpers";
import { treeKillSync } from "../lib/utils/tree-kill";

export class StartServerCommand {
  protected readonly configurationLoader = new ConfigurationLoader();
  protected readonly tsConfigLoader = new TsConfigLoader();
  protected readonly swcFileTransformer = new SwcFileTransformer();

  async handle(options: Record<string, any>): Promise<void> {
    const {
      watch = false,
      debug = false,
      disableTypeCheck,
      path,
      tsconfig,
    } = options;

    const intentConfigFilePath = this.configurationLoader.loadPath(path);
    const intentFileConfig =
      this.configurationLoader.load(intentConfigFilePath);

    const tsConfig = this.tsConfigLoader.load(tsconfig);

    const extraOptions = {
      watch,
      typeCheck: !isTruthy(disableTypeCheck),
      debug,
    };

    const swcOptions = defaultSwcOptionsFactory(
      tsConfig,
      intentFileConfig,
      extraOptions
    );

    const onSuccessHook = this.createOnSuccessHook(
      intentFileConfig,
      tsConfig.compilerOptions,
      extraOptions
    );

    await this.swcFileTransformer.run(
      tsConfig,
      swcOptions,
      extraOptions,
      onSuccessHook
    );
  }

  private createOnSuccessHook(
    intentConfiguration: ConfigurationInterface,
    tsOptions: ts.CompilerOptions,
    extraOptions: ExtraOptions
  ) {
    let childProcessRef: any;
    process.on("exit", () => {
      childProcessRef && treeKillSync(childProcessRef.pid);
    });

    return () => {
      if (childProcessRef) {
        childProcessRef.removeAllListeners("exit");
        childProcessRef.on("exit", () => {
          childProcessRef = this.spawnChildProcess(
            intentConfiguration.entryFile,
            intentConfiguration.sourceRoot,
            extraOptions.debug,
            tsOptions.outDir as string,
            "node"
          );
          childProcessRef.on("exit", () => (childProcessRef = undefined));
        });
        childProcessRef.stdin && childProcessRef.stdin.pause();
        killProcess(childProcessRef.pid);
      } else {
        childProcessRef = this.spawnChildProcess(
          intentConfiguration.entryFile,
          intentConfiguration.sourceRoot,
          extraOptions.debug,
          tsOptions.outDir as string,
          "node"
        );
        childProcessRef.on("exit", (code: number) => {
          process.exitCode = code;
          childProcessRef = undefined;
        });
      }
    };
  }

  private spawnChildProcess(
    entryFile: string,
    sourceRoot: string,
    debug: boolean | string | undefined,
    outDirName: string,
    binaryToRun: string
  ) {
    let outputFilePath = join(outDirName, sourceRoot, entryFile);
    if (!existsSync(outputFilePath + ".js")) {
      outputFilePath = join(outDirName, entryFile);
    }

    let childProcessArgs: string[] = [];
    const argsStartIndex = process.argv.indexOf("--");
    if (argsStartIndex >= 0) {
      // Prevents the need for users to double escape strings
      // i.e. I can run the more natural
      //   nest start -- '{"foo": "bar"}'
      // instead of
      //   nest start -- '\'{"foo": "bar"}\''
      childProcessArgs = process.argv
        .slice(argsStartIndex + 1)
        .map((arg) => JSON.stringify(arg));
    }
    outputFilePath =
      outputFilePath.indexOf(" ") >= 0 ? `"${outputFilePath}"` : outputFilePath;

    const processArgs = [outputFilePath, ...childProcessArgs];
    if (debug) {
      const inspectFlag =
        typeof debug === "string" ? `--inspect=${debug}` : "--inspect";
      processArgs.unshift(inspectFlag);
    }
    processArgs.unshift("--enable-source-maps");
    return spawn(binaryToRun, processArgs, {
      stdio: "inherit",
      shell: true,
    });
  }
}