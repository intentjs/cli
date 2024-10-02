import { ConfigurationLoader } from "../lib/configuration/configuration-loader";
import { defaultSwcOptionsFactory } from "../lib/swc/default-options";
import { SwcFileTransformer } from "../lib/swc/swc-file-transformer";
import { TsConfigLoader } from "../lib/typescript/tsconfig-loader";
import { isTruthy } from "../lib/utils/helpers";

export class BuildCommand {
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

    console.log(swcOptions);
    await this.swcFileTransformer.run(tsConfig, swcOptions, extraOptions);
  }
}
