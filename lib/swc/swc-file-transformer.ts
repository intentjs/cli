import { dirname, join } from "path";
import { defaultSwcOptionsFactory } from "./default-options";
import { transformFileSync } from "@swc/core";
import { mkdirSync, writeFileSync } from "fs-extra";
import * as chokidar from "chokidar";
import { fork } from "child_process";
import { ExtraOptions } from "../interfaces";
import { treeKillSync } from "../utils/tree-kill";
import { TsConfigLoader } from "../commands/tsconfig-loader";

export class SwcFileTransformer {
  tsConfigLoader = new TsConfigLoader();

  async run(
    tsConfig: Record<string, any>,
    options: ReturnType<typeof defaultSwcOptionsFactory>,
    extras: ExtraOptions,
    onSuccessHook?: () => void
  ): Promise<void> {
    if (extras.watch) {
      if (extras.typeCheck) {
        const tsConfigPath = this.tsConfigLoader.loadPath();
        this.runTypeCheck(tsConfigPath, extras);
      }

      this.transformFiles(tsConfig, options, extras, onSuccessHook);
      this.watchIncludedFiles(tsConfig, () =>
        this.transformFiles(tsConfig, options, extras, onSuccessHook)
      );
    } else {
      if (extras.typeCheck) {
        const tsConfigPath = this.tsConfigLoader.loadPath();
        this.runTypeCheck(tsConfigPath, extras);
      }

      this.transformFiles(tsConfig, options, extras, onSuccessHook);
    }
  }

  runTypeCheck(tsConfigPath: string, extras: ExtraOptions) {
    if (extras.watch) {
      const args = [tsConfigPath, JSON.stringify(extras)];
      const childProcess = fork(
        join(__dirname, "../../type-checker/forked-type-checker.js"),
        args,
        { cwd: process.cwd() }
      );

      process.on(
        "exit",
        () => childProcess && treeKillSync(childProcess.pid as number)
      );
    } else {
      console.log("running type checker in non-watch mode");
    }
  }

  transformFiles(
    tsConfig: Record<string, any>,
    options: ReturnType<typeof defaultSwcOptionsFactory>,
    extras: ExtraOptions,
    onSuccessHook?: () => void
  ) {
    const { include = [] } = tsConfig;

    for (const filePath of include) {
      const { code, map } = transformFileSync(filePath, {
        sourceMaps: true,
        module: {
          type: "commonjs",
        },
        jsc: {
          target: "es2021",
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
            useDefineForClassFields: false,
          },
          keepClassNames: true,
          baseUrl: tsConfig.compilerOptions.baseUrl,
          paths: tsConfig?.compilerOptions?.paths,
        },
        filename: filePath,
        minify: false,
        swcrc: true,
      });

      const distFilePath = join(
        tsConfig.compilerOptions.outDir,
        filePath.replace(join(tsConfig.compilerOptions.baseUrl, "/"), "")
      ).replace(join(tsConfig.compilerOptions.baseUrl, "/"), "");

      const codeFilePath = distFilePath
        .replace(/\.ts$/, ".js")
        .replace(/\.tsx$/, ".js");

      mkdirSync(dirname(codeFilePath), { recursive: true });
      writeFileSync(codeFilePath, code);

      if (options.swcOptions.sourceMaps) {
        const mapFilePath = distFilePath
          .replace(/\.ts$/, ".js.map")
          .replace(/\.tsx$/, ".js.map");
        writeFileSync(mapFilePath, map as string);
      }
    }

    onSuccessHook && onSuccessHook();
  }

  watchIncludedFiles(tsConfig: Record<string, any>, onChange: () => void) {
    const watcher = chokidar.watch(
      tsConfig.includeDirs.map((dir: string) => join(dir, "**/*.ts")),
      {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
      }
    );

    watcher.on("add", () => onChange()).on("change", () => onChange());
  }
}
