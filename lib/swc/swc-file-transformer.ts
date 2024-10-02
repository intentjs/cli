import { dirname, join } from "path";
import { defaultSwcOptionsFactory } from "./default-options";
import { transformFile, transformFileSync } from "@swc/core";
import { mkdirSync, writeFileSync } from "fs-extra";
import * as chokidar from "chokidar";
import { fork } from "child_process";
import { ExtraOptions } from "../interfaces";
import { treeKillSync } from "../utils/tree-kill";
import { TsConfigLoader } from "../typescript/tsconfig-loader";
import { debounce } from "radash";
import { TypeCheckerHost } from "../type-checker/type-checker";
import ts = require("typescript");

export class SwcFileTransformer {
  tsConfigLoader = new TsConfigLoader();
  typeCheckerHost = new TypeCheckerHost();

  async run(
    tsConfig: Record<string, any>,
    options: ReturnType<typeof defaultSwcOptionsFactory>,
    extras: ExtraOptions,
    onSuccessHook?: () => void
  ): Promise<void> {
    if (extras.watch) {
      if (extras.typeCheck) {
        await this.runTypeCheck(extras);
      }

      await this.transformFiles(tsConfig, options, extras, onSuccessHook);

      const delayedOnChange = debounce({ delay: 100 }, () =>
        this.transformFiles(tsConfig, options, extras, onSuccessHook)
      );

      this.watchIncludedFiles(tsConfig, delayedOnChange);
    } else {
      if (extras.typeCheck) {
        await this.runTypeCheck(extras);
      }

      await this.transformFiles(tsConfig, options, extras, onSuccessHook);
    }
  }

  async runTypeCheck(extras: ExtraOptions): Promise<void> {
    const tsConfigPath = this.tsConfigLoader.loadPath();

    if (extras.watch) {
      const args = [tsConfigPath, JSON.stringify(extras)];
      const childProcess = fork(
        join(__dirname, "../type-checker/forked-type-checker.js"),
        args,
        { cwd: process.cwd() }
      );

      process.on(
        "exit",
        () => childProcess && treeKillSync(childProcess.pid as number)
      );
    } else {
      const cb = (resolve: Function) =>
        this.typeCheckerHost.runOnce(tsConfigPath, {
          watch: false,
          onTypeCheck: (program: ts.Program) => {
            resolve(true);
          },
        });
      return new Promise((resolve) => cb(resolve));
    }
  }

  async transformFiles(
    tsConfig: Record<string, any>,
    options: ReturnType<typeof defaultSwcOptionsFactory>,
    extras: ExtraOptions,
    onSuccessHook?: () => void
  ) {
    const { include = [] } = tsConfig;
    const fileTransformationPromises = [];

    for (const filePath of include) {
      const newP = (resolve: Function) =>
        transformFile(filePath, { ...options, filename: filePath })
          .then(({ code, map }) => {
            const distFilePath = join(
              tsConfig.compilerOptions.outDir,
              filePath.replace(join(tsConfig.compilerOptions.baseUrl, "/"), "")
            ).replace(join(tsConfig.compilerOptions.baseUrl, "/"), "");

            const codeFilePath = join(
              process.cwd(),
              distFilePath.replace(/\.ts$/, ".js").replace(/\.tsx$/, ".js")
            );
            mkdirSync(dirname(codeFilePath), { recursive: true });
            writeFileSync(codeFilePath, code);

            if (options.sourceMaps) {
              const mapFilePath = distFilePath
                .replace(/\.ts$/, ".js.map")
                .replace(/\.tsx$/, ".js.map");
              writeFileSync(mapFilePath, map as string);
            }
            resolve(1);
          })
          .catch((err) => {
            console.log("caaughty error ===> ", err);
          });

      fileTransformationPromises.push(new Promise(newP));
    }

    await Promise.allSettled(fileTransformationPromises);

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
