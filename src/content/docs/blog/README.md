# Authoring blog posts

New blog posts live in this directory (`src/content/docs/blog/`). Create a `.md`
or `.mdx` file here and it will automatically appear in the blog index at
`/blog`.

> This README documents the workflow for contributors. It is excluded from the
> built site (see the `README.md` exclusion in `src/content.config.ts`), so it
> will not appear as a blog post.

## Frontmatter

Every post supports the following frontmatter fields:

| Field | Required | Description |
| --- | --- | --- |
| `title` | yes | The post title. |
| `date` | yes | Publish date (`YYYY-MM-DD`). Controls ordering. |
| `description` | recommended | Used for the `<meta>`/OpenGraph description (SEO) and, by default, as the blog card summary. Authored the same way as docs pages. |
| `authors` | no | An author key (e.g. `genkit`), an inline object, or a list. |
| `excerpt` | no | Overrides the card summary on the index and tag pages. Defaults to `description` when omitted. |
| `tags` | no | A list of tags. Each generates a `/blog/tags/<tag>` page. |
| `cover` | no | A cover image (`alt` + `image`) shown on cards and at the top of the post. |
| `featured` | no | Set to `true` to pin the post above recent posts in the sidebar. |

## Authors

Shared authors are defined once in `astro.config.mjs` under the `starlightBlog`
plugin's `authors` option, then referenced by key. You can also specify a
one-off author inline:

```yaml
authors:
  name: Ada Lovelace
  title: Guest author
  url: https://example.com
```

## Markdown vs. MDX

Use a plain `.md` file for prose-only posts. Switch to `.mdx` when you want to
import and render components. See
`announcing-genkit-middleware.mdx` for a component example
(Starlight `Tabs`, an embedded video, and more).

## Assets

Co-locate images and videos in `_assets/` (the leading underscore keeps them out
of the content collection). Reference them with a relative path from the post,
e.g. `./_assets/my-cover.png`.
