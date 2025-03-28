// This adds Jest types to the global namespace
import "@types/jest";

declare global {
  namespace NodeJS {
    interface Global {
      // Add Jest globals
      jest: typeof jest;
      describe: typeof describe;
      it: typeof it;
      test: typeof test;
      expect: typeof expect;
      beforeEach: typeof beforeEach;
      afterEach: typeof afterEach;
    }
  }
}
