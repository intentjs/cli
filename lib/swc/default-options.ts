import { ConfigurationInterface } from "../configuration/interface";
import { ExtraOptions } from "../interfaces";

export const defaultSwcOptionsFactory = (
  tsOptions: Record<string, any>,
  configuration: ConfigurationInterface,
  extras: ExtraOptions
) => {
  return {
    swcOptions: {
      sourceMaps:
        tsOptions?.sourceMap || (tsOptions?.inlineSourceMap && "inline"),
      module: {
        type: "commonjs",
      },
      exclude: ["node_modules", "dist"],
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
        baseUrl: tsOptions?.compilerOptions?.baseUrl,
        paths: tsOptions?.compilerOptions?.paths,
      },
      minify: false,
      swcrc: true,
    },
    cliOptions: {
      outDir: tsOptions?.outDir ? convertPath(tsOptions.outDir) : "dist",
      filenames: tsOptions.include,
      sync: false,
      extensions: [".js", ".ts", ".tsx"],
      copyFiles: false,
      includeDotfiles: false,
      quiet: false,
      watch: extras.watch,
      stripLeadingPaths: true,
    },
  };
};

/**
 * Converts Windows specific file paths to posix
 * @param windowsPath
 */
function convertPath(windowsPath: string) {
  return windowsPath
    .replace(/^\\\\\?\\/, "")
    .replace(/\\/g, "/")
    .replace(/\/\/+/g, "/");
}
