import type { LoadContext } from "@docusaurus/types";
import { docuHash, normalizeUrl } from "@docusaurus/utils";
import { normalizePluginOptions } from "@docusaurus/utils-validation";
import { describe, expect, it, jest } from "@jest/globals";

import pluginSsgFetch, {
  validateOptions,
  type PluginOptions,
} from "../src/index";

describe("pluginSsgFetch()", () => {
  describe("loadContent()", () => {
    it("returns data from provided URLs", async () => {
      const configs = [
        {
          url: "https://api.example.com/data1.json",
          path: "/path1",
          component: "@site/src/fetch-data-pages/page1.tsx",
        },
        {
          url: "https://api.example.com/data2.json",
          path: "/path2",
          component: "@site/src/fetch-data-pages/page2.tsx",
        },
      ];
      const data = [[1, 2, 3], { a: 1, b: 2 }];
      const mockJson = jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve(data[0]))
        .mockImplementationOnce(() => Promise.resolve(data[1]));
      const mockFetch = jest.fn(() =>
        Promise.resolve({
          json: mockJson,
        }),
      );
      // @ts-expect-error Override global.fetch
      global.fetch = mockFetch;
      const plugin = await pluginSsgFetch({} as LoadContext, {
        configs,
      });
      const loadedData = await plugin.loadContent!();

      expect(mockFetch).toHaveBeenNthCalledWith(1, configs[0].url);
      expect(mockFetch).toHaveBeenNthCalledWith(2, configs[1].url);
      expect(mockJson).toHaveBeenCalledTimes(2);
      expect(loadedData).toEqual(data);
    });

    it("returns {} when load failed", async () => {
      const mockJson = jest.fn(() => Promise.reject("Illegal JSON"));
      const mockFetch = jest
        .fn()
        // first time fetch() throws
        .mockImplementationOnce(() => Promise.reject("Network problem"))
        // second time json() throws
        .mockImplementationOnce(() =>
          Promise.resolve({
            json: mockJson,
          }),
        );
      // @ts-expect-error Override global.fetch
      global.fetch = mockFetch;
      const plugin = await pluginSsgFetch({} as LoadContext, {
        configs: [
          {
            url: "https://api.example.com/data1.json",
            path: "/path1",
            component: "@site/src/fetch-data-pages/page1.tsx",
          },
          {
            url: "https://api.example.com/data2.json",
            path: "/path2",
            component: "@site/src/fetch-data-pages/page2.tsx",
          },
        ],
      });
      const loadedData = await plugin.loadContent!();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockJson).toHaveBeenCalledTimes(1);
      expect(loadedData).toEqual([{}, {}]);
    });
  });

  describe("contentLoaded()", () => {
    it("calls createData() and addRoute() for each config with loaded data", async () => {
      const configs = [
        {
          url: "https://api.example.com/data1.json",
          path: "/path1",
          component: "@site/src/fetch-data-pages/page1.tsx",
          propName: "numbers",
        },
        {
          url: "https://api.example.com/data2.json",
          path: "/path2",
          component: "@site/src/fetch-data-pages/page2.tsx",
        },
      ];
      const data = [[1, 2, 3], { a: 1, b: 2 }];
      const baseUrl = "/base";
      const plugin = await pluginSsgFetch(
        { siteConfig: { baseUrl } } as LoadContext,
        {
          configs,
        },
      );
      const dataPaths = ["data1.json", "data2.json"];
      const mockCreateData = jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve(dataPaths[0]))
        .mockImplementationOnce(() => Promise.resolve(dataPaths[1]));
      const mockAddRoute = jest.fn();
      await plugin.contentLoaded!({
        content: data,
        // @ts-expect-error Mock type does not matter
        actions: { createData: mockCreateData, addRoute: mockAddRoute },
      });

      configs.forEach((config, index) => {
        expect(mockCreateData).toHaveBeenNthCalledWith(
          index + 1,
          `${docuHash(configs[index].url)}.json`,
          data[index],
        );
        expect(mockAddRoute).toHaveBeenNthCalledWith(index + 1, {
          path: normalizeUrl([baseUrl, config.path]),
          component: config.component,
          modules: {
            [config.propName ?? "data"]: dataPaths[index],
          },
          exact: true,
        });
      });
    });
  });
});

describe("validateOptions()", () => {
  function testValidate(options: Partial<PluginOptions>) {
    return validateOptions({ validate: normalizePluginOptions, options });
  }

  it("returns empty array of configs for undefined user options", () => {
    expect(testValidate({}).configs).toEqual([]);
  });

  it("throws error if configs[].url is missing", () => {
    expect(() => {
      testValidate({
        configs: [
          // @ts-expect-error Missing required property: url
          {
            path: "/path",
            component: "component",
          },
        ],
      });
    }).toThrow('"configs[0].url" is required');
  });

  it("throws error if configs[].path is missing", () => {
    expect(() => {
      testValidate({
        configs: [
          // @ts-expect-error Missing required property: path
          {
            url: "url",
            component: "component",
          },
        ],
      });
    }).toThrow('"configs[0].path" is required');
  });

  it("throws error if configs[].component is missing", () => {
    expect(() => {
      testValidate({
        configs: [
          // @ts-expect-error Missing required property: component
          {
            url: "url",
            path: "/path",
          },
        ],
      });
    }).toThrow('"configs[0].component" is required');
  });

  it("throws error if configs[].url is empty", () => {
    expect(() => {
      testValidate({
        configs: [
          {
            url: "",
            path: "/path",
            component: "component",
          },
        ],
      });
    }).toThrow('"configs[0].url" is not allowed to be empty');
  });

  it("throws error if configs[].path is empty", () => {
    expect(() => {
      testValidate({
        configs: [
          {
            url: "url",
            path: "",
            component: "component",
          },
        ],
      });
    }).toThrow('"configs[0].path" is not allowed to be empty');
  });

  it("throws error if configs[].component is empty", () => {
    expect(() => {
      testValidate({
        configs: [
          {
            url: "url",
            path: "/path",
            component: "",
          },
        ],
      });
    }).toThrow('"configs[0].component" is not allowed to be empty');
  });

  it("defaults to 'data' when configs[].propName is not provided", () => {
    expect(
      testValidate({
        configs: [
          {
            url: "url",
            path: "/path",
            component: "component",
          },
        ],
      }).configs[0].propName,
    ).toEqual("data");
  });
});

// cSpell:ignore docu
