export const defaultIntentConfiguration = () => {
  return {
    sourceRoot: "app",
    entryFile: "main",
    debug: true,
    buildOptions: { deleteOutDir: true },
    swc: { configPath: ".swcrc" },
  };
};
