import * as ts from "typescript";

export class TypeScriptBinaryLoader {
  private tsBinary?: typeof ts;

  public load(): typeof ts {
    if (this.tsBinary) {
      return this.tsBinary;
    }

    console.log(this.getModulePaths());
    try {
      const tsBinary = require("typescript");
      this.tsBinary = tsBinary;
      return tsBinary;
    } catch {
      throw new Error(
        'TypeScript could not be found! Please, install "typescript" package.'
      );
    }
  }

  public getModulePaths() {
    console.log(module.paths);
    const modulePaths = module.paths.slice(2, module.paths.length);
    const packageDeps = modulePaths.slice(0, 3);
    return [
      ...packageDeps.reverse(),
      ...modulePaths.slice(3, modulePaths.length).reverse(),
    ];
  }
}
