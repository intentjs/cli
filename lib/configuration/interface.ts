export type ConfigurationInterface = {
  sourceRoot: string;
  entryFile: string;
  debug?: boolean;
  buildOptions?: {
    deleteOutDir: boolean;
  };
};
