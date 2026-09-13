# LinkedIn announcements

Published LinkedIn posts about konspekt, kept under version control.

## Convention

- **One directory per post:** `post_YYYY-MM-DD/`, where the date is the
  intended or actual publish date.
- Each post directory contains:
  - `post.md` — the feed post: frontmatter plus body (see `TEMPLATE/`).
    Carries `format: feed`.
  - `article.md` — optional long-form LinkedIn Article covering the same
    announcement, carrying `format: article`, a `title`, and a `cover` image.
    Articles support headings, bullet lists, real hyperlinks, and inline
    images with captions. When both files are present, publish the article
    first, then link it from the feed post (its `first_comment`).
  - `article.html` — optional paste-ready copy of `article.md`. LinkedIn's
    Article editor has no file import; open this in a browser, copy, and paste
    into the editor so headings, links, and lists carry across (Markdown
    pasted as plain text does not). Images are inserted manually in the editor.
  - `images/` — the exact images that were published (rendered PNGs,
    screenshots), if any.
  - `carousel.pdf` — optional multi-page PDF uploaded to LinkedIn as a
    document (a swipeable carousel), assembled from the images. When present,
    `post.md` records it in a `carousel:` frontmatter field.
- The `assets` list in `post.md` records what went in the post. Each entry
  can carry a `file` (the published image, local to the post directory) and a
  `source` (the repo path it was rendered from, e.g. under `docs/visuals/`),
  so the published artifact is stored without duplicating its source.
- Treat posts as regular code. A post is **published when its directory is
  merged into `main`**. Drafts live on branches and open pull requests.
- The `url` field is filled in once the post is live on LinkedIn.

To start a post, copy `TEMPLATE/` to `post_YYYY-MM-DD/` and edit.

## Posts

| Date | Announces | Live URL |
| --- | --- | --- |
| 2026-09-13 | PR #19 — UI sources (draft) | |
