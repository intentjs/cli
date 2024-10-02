export type ConfigurationInterface = {
  sourceRoot: string;
  containerFile: string;
  serverFile: string;
  debug?: boolean;
  buildOptions?: {
    deleteOutDir: boolean;
  };
};
