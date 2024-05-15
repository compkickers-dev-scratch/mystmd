---
title: Website Themes & Templates
description: There are two templates for MyST websites, a `book-theme`, based loosely on JupyterBook, and an `article-theme` that is designed for scientific documents with supporting notebooks.
---

Web templates allow MyST to render documents as HTML-based sites.
These provide different reading experiences that are designed for different types of MyST documents.
They are defined via the same templating system used for [static document exporting](./documents-exports.md), and a base set of web themes can be found in the [`executablebooks/myst-themes` repository](https://github.com/executablebooks/myst-theme/tree/main/themes).

:::{tip} Themes and templates mean the same thing
For the remainder of this page, assume that "theme" and "template" mean the same thing.
:::

## Themes bundled with MyST

There are two templates for MyST websites, a `book-theme`, which is the default and is based loosely on JupyterBook and an `article-theme` that is designed for scientific documents with supporting notebooks. The documentation for this site uses the `book-theme`. For a demonstration of the `article-theme`, you can see [an article on finite volume](https://simpeg.xyz/tle-finitevolume).

:::::{tab-set}
::::{tab} Article Theme
:::{figure} ./images/article-theme.png
Example of a banner in a site using the `article-theme`, ([online](https://simpeg.xyz/tle-finitevolume/), [source](https://github.com/simpeg/tle-finitevolume))
:::
::::

::::{tab} Book Theme
:::{figure} ./images/book-theme.png
Example of a site using the `book-theme`, ([online](https://mystmd.org), [source](https://github.com/executablebooks/mystmd/tree/main/docs))
:::
::::
:::::

### Article Theme

The article theme is centered around a single document with supporting content, which is how many scientific articles are structured today: a narrative article with associated computational notebooks to reproduce a figure, document data-cleaning steps, or provide interactive visualization. These are listed as "supporting documents" in this theme and can be pulled in as normal with your [](./table-of-contents.md). For information on how to import your figures into your article, see [](./reuse-jupyter-outputs.md).

The frontmatter that is displayed at the top of the article is the contents of your project, including a project [thumbnail and banner](#thumbnail-and-banner). The affiliations for your authors, their ORCID, email, etc. are available by clicking directly on the author name.

## Change Site Templates

To manually specify your website template, use the `site.template` property:

```{code} yaml
:filename: myst.yml
:emphasize-lines: 4
:caption: Change the `template` property to `article-theme`.
:linenos:
project:
  ...
site:
  template: article-theme
```

(site-navigation)=
## Site navigation

In addition to [your MyST document's Table of Contents](./table-of-contents.md), you may specify a top-level navigation for your MyST site.
These links are displayed across all pages of your site, and are useful for quickly jumping to sections of your site, or for external links.

Specify top-level navigation with the `site.nav` option, and provide a collection of navigation links similar to [how the Table of Contents is structured](./table-of-contents.md). For example:

```{code-block} yaml
:filename: myst.yml

site:
  nav:
    # A top-level dropdown
    - title: Dropdown links
      children:
        - title: Page one
          url: https://mystmd.org
        - title: Page two
          url: https://mystmd.org/guide
    # A top-level link
    - title: A standalone link
      url: https://jupyter.org
```

% TODO: Clarify why some things have their own section (nav: and actions:) while
%       others are nested under site.options.
## Action buttons

Action buttons provide a more noticeable button that invites users to click on them.
They are located in the top-right of the page.

Add action buttons to your site header with the `site.actions` option. For example:

```{code-block} yaml
:filename: myst.yml

site:
  actions:
    - title: Button text
      url: https://mystmd.org
    - title: Second button text
      url: https://mystmd.org/guide
```

(site-options)=

## Site Options

Site options allow you to configure a theme's behavior.[^opts]
These should be placed in the `site.options` in your `myst.yml`.
For example:

[^opts]: They are generally unique to the theme (and thus in a dediated `site.options` key rather than a top-level option in `site`).


```{code-block} yaml
:filename: myst.yml
site:
  options:
    favicon: my-favicon.ico
    logo: my-site-logo.svg
```

Below is a table of options for each theme bundled with MyST.

```{myst:template} book-theme
:heading-depth: 3
```


```{myst:template} article-theme
:heading-depth: 3
```

## Other top-level site configuration

There are some other top-level site configuration options not documented here.
You can find them in the following two files.

% TODO: Add proper documentation for these
%   ref: https://github.com/executablebooks/mystmd/issues/1211
https://github.com/executablebooks/mystmd/blob/8e7ac4ae05d833140181ed69aa1e354face7caa0/packages/myst-frontmatter/src/site/types.ts#L57-L83


https://github.com/executablebooks/mystmd/blob/main/packages/myst-config/src/site/types.ts?rgh-link-date=2024-05-15T06%3A31%3A26Z#L26-L33
