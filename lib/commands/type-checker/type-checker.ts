import * as ts from "typescript";
import * as pc from "picocolors";
import { TSC_LOG_PREFIX } from "../../utils/log-helpers";

/* eslint-disable @typescript-eslint/no-var-requires */

export type TypeCheckerOptions = {
  watch?: boolean;
  onTypeCheck?: (program: ts.Program) => void;
  onProgramInit?: (program: ts.Program) => void;
};

export class TypeCheckerHost {
  run(
    tsConfigPath: string,
    tsConfig: Record<string, any>,
    options?: TypeCheckerOptions
  ) {
    console.log(tsConfigPath, tsConfig, options);
  }

  runInWatchMode(
    tsConfigPath: string,
    tsConfig: Record<string, any>,
    options?: TypeCheckerOptions
  ) {
    let watchProgram: ts.WatchOfConfigFile<ts.BuilderProgram> | undefined =
      undefined;

    const origDiagnosticReporter = (ts as any).createDiagnosticReporter(
      ts.sys,
      true
    );

    const host = ts.createWatchCompilerHost(
      tsConfigPath,
      { ...tsConfig.compilerOptions, preserveWatchOutput: true, noEmit: true },
      ts.sys,
      undefined,
      origDiagnosticReporter,
      (
        diagnostic: ts.Diagnostic,
        newLine: string,
        compilerOptions: ts.CompilerOptions,
        errorCount?: number
      ) => {
        errorCount = errorCount || 0;

        if (errorCount > 0) {
          console.log(TSC_LOG_PREFIX, pc.red(diagnostic.messageText as string));
        }

        if (!watchProgram) return;
        options?.onTypeCheck?.(watchProgram.getProgram().getProgram());
      }
    );

    watchProgram = ts.createWatchProgram(host);
    process.nextTick(() => {
      options?.onProgramInit?.(watchProgram.getProgram().getProgram());
    });
  }
}
