# docusaurus-plugin-ssg-fetch

A Docusaurus plugin that allows you to [fetch data](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) while doing [static site generation](https://docusaurus.io/docs/advanced/ssg).

It basically functions as [fetching data in Server Components](https://nextjs.org/docs/app/getting-started/fetching-data#with-the-fetch-api) in [Next.js](https://nextjs.org/).

> [!IMPORTANT]
> Currently, it has limitations, contributions welcomed:
>
> - One fetch URL per page, could not set headers or use "POST" method, etc
> - Only support fetch [JSON](https://www.json.org/) data

## Installation

```bash
npm install --save docusaurus-plugin-ssg-fetch
```

## Configuration

| Name                | Type   | Default | Description                                                                                                                                        |
| ------------------- | ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| configs             | array  | []      | An array of data fetching configurations.                                                                                                          |
| configs[].url       | string |         | The URL of the data to fetch.                                                                                                                      |
| configs[].path      | string |         | The route path where the component will be accessed.                                                                                               |
| configs[].component | string |         | The name of the component associated with the data.                                                                                                |
| configs[].propName  | string | "data"  | An optional property name to be used to [pass the data to the component](https://docusaurus.io/docs/api/plugin-methods/lifecycle-apis#createData). |

> [!IMPORTANT]  
> We [generate routes](https://docusaurus.io/docs/api/plugin-methods/lifecycle-apis#addRoute) for our components, so the components must **NOT** be in the `path` of [other plugins that generate routes automatically](https://docusaurus.io/docs/advanced/routing) (or you can `exclude` them):
>
> - [`plugin-content-pages`](https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-pages#configuration) (which defaults to `src/pages`)
> - [`plugin-content-docs`](https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs#configuration) (which defaults to `docs`)
> - [`plugin-content-blog`](https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-blog#configuration) (which defaults to `blog`)

## Example

```javascript
// docusaurus.config.js
export default {
  plugins: [
    [
      "docusaurus-plugin-ssg-fetch",
      {
        configs: [
          {
            url: "https://api.example.com/friends.json",
            path: "/friends",
            component: "@site/src/fetch-data-pages/friends.tsx",
            propName: "friends", // Optional, default to "data"
          },
          {
            url: "https://api.example.com/events.json",
            path: "/events",
            component: "@site/src/fetch-data-pages/events.tsx",
          },
        ],
      },
    ],
  ],
};
```

```javascript
// @site/src/fetch-data-pages/friends.tsx
export default function Friends({ friends }) {
  // propName named to "friends"
  return (
    <ul>
      {friends &&
        friends.length > 0 &&
        friends.map((friend) => <li key={friend.url}>{friend.name}</li>)}
    </ul>
  );
}
```

```javascript
// @site/src/fetch-data-pages/events.tsx
export default function Events({ data }) {
  // propName defaults to "data"
  return (
    <ul>
      {data &&
        data.length > 0 &&
        data.map((event) => <li key={event.id}>{event.name}</li>)}
    </ul>
  );
}
```

## License

[MIT](LICENSE)

## References

- [Data-Loading for Docusaurus Routes](https://daviddalbusco.com/blog/data-loading-for-docusaurus-routes/)
- [Dynamic Routes and Data Fetching](https://github.com/facebook/docusaurus/issues/4710)
