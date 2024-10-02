import ts from "typescript";
import { TypeCheckerHost } from "./type-checker";
import { ExtraOptions } from "../interfaces";

const [tsConfigPath, stringifiedExtra] = process.argv.slice(2);

export class ForkedTypeCheckerHost {
  private typeChecker = new TypeCheckerHost();

  run(tsConfigPath: string, extras: ExtraOptions) {
    const onTypeCheckFunction = (program: ts.Program) => {
      console.log("function running ===> ");
      const diagnostics = ts.getPreEmitDiagnostics(program);
      const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
        getCanonicalFileName: (path) => path,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine,
      };

      console.log(formatDiagnosticsHost);

      console.log(
        ts.formatDiagnosticsWithColorAndContext(
          diagnostics,
          formatDiagnosticsHost
        )
      );
    };

    this.typeChecker.runInWatchMode(tsConfigPath, {
      watch: extras.watch,
      onProgramInit: onTypeCheckFunction,
      onTypeCheck: onTypeCheckFunction,
    });
  }
}

const forkedTypeChecker = new ForkedTypeCheckerHost();
forkedTypeChecker.run(tsConfigPath, JSON.parse(stringifiedExtra));
