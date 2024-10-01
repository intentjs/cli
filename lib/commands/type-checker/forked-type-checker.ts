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
      onTypeCheck: (program: ts.Program) => {},
    });
  }
}

const forkedTypeChecker = new ForkedTypeCheckerHost();
forkedTypeChecker.run(tsConfigPath, JSON.parse(stringifiedExtra));
