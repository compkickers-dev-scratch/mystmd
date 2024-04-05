---
title: Downloads, Links and Static Files
short_title: Downloads & Static Files
description: Add download links to your website on each page or project
---

Downloads are downloadable files or useful links you want available on your MyST site. They may be defined at the project or the page level.

- If you specify project-level `downloads:` configuration, it will **append** each item to the source-file download of each page.
- If you specify page-level `downloads:` configuration, it will **override** project-level configuration as well as page defaults.

## Download links configuration

Each download link entry has configuration that modifies its behavior.
Note that each entry may only specify one of `id`, `file`, or `url`.
Descriptions of these fields and other available fields are in the table below from the [downloads configuration](#frontmatter:downloads).

![](#table-frontmatter-downloads)

## Include a built PDF

If you want to include a PDF of your document with the downloads, take these steps:

1. **Build the PDF**. For examples of how to build PDFs, see [](creating-pdf-documents.md). Let's say the PDF was output to `./mydoc.pdf`.
2. **Specify the file path in your page's metadata**. The filepath should point to the location of the built PDF relative to the page.

```{code-block} yaml
:filename: article.md
---
downloads:
  - file: ./mydoc.pdf
    title: A PDF of this document
---
```

An entry for this PDF will now show up in your page's downloads dropdown.
If you do not specify the output location of your export we recommend that you refer to it by an ID,
rather than linking to the `./_build/exports` folder, as these may change depending on your exports list. See [below](#multiple-downloads) for an example.

## Specify a download for all pages of a MyST site

If you'd like a download link to show up for all pages of a MyST site, use configuration at the `myst.yml` level.
For example, let's say you used `typst` to generate a PDF of _all documents in your MyST site_, called `mybook.pdf`.

```{code-block} yaml
:filename: myst.yml
project:
  downloads:
    - file: mybook.pdf
      title: A PDF of this book
```

## Include the raw source file

You may include the raw source of a file as a download by referencing the file itself in the download frontmatter.
For example inside file `index.md`, you may do:

```yaml
downloads:
  - file: index.md
    title: Source File
```

(multiple-downloads)=

## Include several downloads at once

The following example has several downloads: the source file, as above, an exported pdf, a remote file, and a link to another website.
In addition, when you specify `downloads:`, it will over-ride the default download behavior (which is to link to the source file of the current page).
This example manually includes a download to the source file to re-enable this.

```{code-block} yaml
:filename: index.md
---
exports:
  - output: paper.pdf
    template: lapreprint-typst
    id: my-paper
downloads:
  - file: index.md
    title: Source File
  - id: my-paper
    title: Publication
  - url: https://example.com/files/script.py
    filename: script.py
    title: Sample Code
  - url: https://example.com/more-info
    title: More Info
---
```
