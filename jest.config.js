import { createDefaultPreset } from "ts-jest";

/** @type {import('jest').Config} */
export default {
  ...createDefaultPreset(),
  // workaround for https://github.com/kulshekhar/ts-jest/issues/5013
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },
};
