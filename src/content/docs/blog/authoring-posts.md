---
title: How to author a blog post
date: 2026-05-28
authors: genkit
description: A quick reference for adding new posts to the Genkit blog, including frontmatter fields and where files live.
tags:
  - guides
---

New blog posts live in `src/content/docs/blog/` in the docsite repo. Create a
`.md` or `.mdx` file there and it will automatically appear in the blog index
at `/blog`.

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

Shared authors are defined once in `astro.config.mjs` under the
`starlightBlog` plugin's `authors` option, then referenced by key. You can also
specify a one-off author inline:

```yaml
authors:
  name: Ada Lovelace
  title: Guest author
  url: https://example.com
```

## Markdown vs. MDX

Use a plain `.md` file for prose-only posts. Switch to `.mdx` when you want to
import and render components. See the
[welcome post](/blog/welcome-to-the-genkit-blog) for a component example.
