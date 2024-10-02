import * as ts from "typescript";
import { TypeCheckerHost } from "./type-checker";
import { ExtraOptions } from "../interfaces";

const [tsConfigPath, stringifiedExtra] = process.argv.slice(2);

export class ForkedTypeCheckerHost {
  private typeChecker = new TypeCheckerHost();

  run(tsConfigPath: string, extras: ExtraOptions) {
    this.typeChecker.runInWatchMode(tsConfigPath, {
      watch: extras.watch,
      onProgramInit: (program: ts.Program) => {},
      onTypeCheck: (program: ts.Program) => {
        const diagnostics = ts.getPreEmitDiagnostics(program);
        const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
          getCanonicalFileName: (path) => path,
          getCurrentDirectory: ts.sys.getCurrentDirectory,
          getNewLine: () => ts.sys.newLine,
        };

        console.log("printing the formatted diagnostic");
        console.log(
          ts.formatDiagnosticsWithColorAndContext(
            diagnostics,
            formatDiagnosticsHost
          )
        );
      },
    });
  }
}

const forkedTypeChecker = new ForkedTypeCheckerHost();
forkedTypeChecker.run(tsConfigPath, JSON.parse(stringifiedExtra));
