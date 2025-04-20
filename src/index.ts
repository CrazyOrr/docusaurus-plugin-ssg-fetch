import type {
  LoadContext,
  OptionValidationContext,
  Plugin,
} from "@docusaurus/types";
import { docuHash, normalizeUrl } from "@docusaurus/utils";
import { Joi } from "@docusaurus/utils-validation";

/**
 * Represents the options for configuring the plugin.
 *
 * @property id - An optional identifier for the plugin.
 * @property configs - An array of data fetching configurations.
 * @property configs[].url - The URL of the data to fetch.
 * @property configs[].path - The route path where the component will be accessed.
 * @property configs[].component - The name of the component associated with the data.
 * @property configs[].propName - An optional property name to be used to pass the data to the component.
 */
export type PluginOptions = {
  id?: string;
  configs: {
    url: string;
    path: string;
    component: string;
    propName?: string;
  }[];
};

export default async function pluginSsgFetch(
  context: LoadContext,
  options: PluginOptions,
): Promise<Plugin> {
  const { siteConfig } = context;
  const { configs } = options;
  return {
    name: "docusaurus-plugin-ssg-fetch",
    async loadContent() {
      return Promise.all(
        configs.map(async ({ url }) => {
          let data = {};
          try {
            const res = await fetch(url);
            data = await res.json();
          } catch (e) {
            console.error(e);
          }
          return data;
        }),
      );
    },
    async contentLoaded({ content, actions }) {
      const { baseUrl } = siteConfig;
      const { createData, addRoute } = actions;
      for (const [
        index,
        { url, path, component, propName = "data" },
      ] of configs.entries()) {
        const permalink = normalizeUrl([baseUrl, path]);
        const dataJsonPath = await createData(
          `${docuHash(url)}.json`,
          // @ts-expect-error content is unknown
          content[index],
        );
        addRoute({
          path: permalink,
          component,
          modules: {
            [propName]: dataJsonPath,
          },
          exact: true,
        });
      }
    },
  };
}

const PluginOptionSchema = Joi.object<PluginOptions>({
  configs: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        path: Joi.string().required(),
        component: Joi.string().required(),
        propName: Joi.string().default("data"),
      }),
    )
    .default([]),
});

type Options = Partial<PluginOptions>;

export function validateOptions({
  validate,
  options,
}: OptionValidationContext<Options, PluginOptions>): PluginOptions {
  const validatedOptions = validate(PluginOptionSchema, options);
  return validatedOptions;
}

// cSpell:ignore docu
