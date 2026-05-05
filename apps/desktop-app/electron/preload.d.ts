export {};

declare global {
  interface Window {
    omniaDesktop?: {
      platform: NodeJS.Platform;
      versions: {
        electron: string;
        chrome: string;
        node: string;
      };
    };
  }
}
