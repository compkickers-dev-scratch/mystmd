---
title: External references
description: External references dynamically include content into your MyST projects, from Wikipedia, intersphinx, DOIs, RRIDs, and any other MyST projects. Allowing your documents to be rich, interactive and automatically kept up to date.
thumbnail: ./thumbnails/external-references.png
---

MyST allows you to connect your <wiki:documents> to external [linked](wiki:Hyperlink) content like <wiki:Wikipedia>, which allow for [hover](wiki:Hovercraft)-references with external content.
External references are references to structured content or documents that are outside of your project.
MyST supports referencing rich content in a growing number of formats, including:

1. other `mystjs` projects, with rich cross-linking of content
1. integrating directly with **Wikipedia** articles to show tooltips,
1. linking to other **Sphinx** documentation using intersphinx,
1. link to files on **GitHub** and show inline previews,
1. showing structured content from scholarly sources like **DOIs** or **RRIDs**.

```{seealso}
[](./cross-references.md) for referencing content in your project and [](./citations.md) to cite scholarly work and create bibliographies.
```

## Referencing external MyST projects

When using the HTML renderer for MyST, an API is provided for the deployed site.
This provides pre-parsed, structured content as an AST that can be included and rendered in a tooltip.

```{tip}
Try adding `.json` at the end of the URL on this page. The data is structured and provides authors, license information,
as well as the full content in a parsed form that can be used for an inline reference on external pages.
```

```{note}
Currently cross-project links aren't fully implemented, check back soon!
```

(intersphinx)=

## Referencing external Sphinx documentation

MyST can integrate directly with other Sphinx documentation, which is used in many Python projects including the [standard library](https://docs.python.org/).

In your project configuration, include the `references` object with named links out to the Sphinx or MyST documentation that you will reference in the project. For example, in the demonstration below we will load the Python 3.7 documentation and JupyterBook docs, both of which use sphinx and expose cross references through an `objects.inv` file.

(intersphinx-config)=

```yaml
references:
  python: https://docs.python.org/3.7/
  jupyterbook: https://jupyterbook.org/en/stable/
```

When you specify these in your project configuration, MyST will load and cache the remote `objects.inv` file,
and provide access to all of the references in that project.

````{important}
# Intersphinx Examples

```{list-table}
:header-rows: 1
* - MyST Syntax
  - Rendered
* - `[](myst:python#zipapp-specifying-the-interpreter)`
    : A reference to the reference documentation in Python.
  - [](myst:python#zipapp-specifying-the-interpreter)
* - `[](myst:jupyterbook#content:references)`
    : A reference to the JupyterBook documentation, that brings you directly to the reference,
      as well as fills in the label text.
  - [](myst:jupyterbook#content:references)
* - `<myst:#library/abc>`
    : A simplified link that will resolve to the first external inventory that satisfies the target.
  - <myst:#library/abc>
```
````

To reference a function, class or label in the linked documentation, use the `myst:` protocol in a link followed by the `project` key and the target.
For example, `<myst:python#library/abc>` renders to:\
"<myst:python#library/abc>"\
and is made of a `protocol`, `project` and `target`.

protocol
: The protocol for this type of link is `myst:`, and is what selects for cross-project referening.

project
: the `project` key above is "python" which is defined in your local [project configuration](#intersphinx-config) above.
: The project is optional, however, we recommend that you include it to both efficiently look up the reference as well as be explicit as to what project you are referring to.
: If the project is not included, all projects will be searched for the reference in the order given in the `intersphinx` configuration.

target
: The target is everything that follows the `#` and is a named reference in the project.
: In the example above it is "library/abc".

As with any link, the text can be overridden using markdown link syntax `[text](myst:...)`.

````{tip}
:class: dropdown
# How to find the intersphinx target?

The HTML IDs that are part of the documentation are not always the targets that are used in the documentation. The easiest way to find the target to use is to look at the source documentation in RST or MyST.

Look for the `(target)=` syntax or `:label:` or `:name:` on a directive.

MyST will warn you in the console if your target is not found.

You can also use the [intersphinx](https://www.npmjs.com/package/intersphinx) package, for example, `list`, or `parse` an intersphinx inventory:

```bash
>> intersphinx list https://docs.python.org/3.7 --domain std:doc --includes abc --limit 5

std:doc Abstract Base Classes (library/abc)
  https://docs.python.org/3.7/library/abc.html
std:doc Abstract Base Classes for Containers (library/collections.abc)
  https://docs.python.org/3.7/library/collections.abc.html
```

Use the target in the parenthesis, which would be `myst:python#library/abc` above.
````

## Wikipedia Links

MyST can directly integrate with <wiki:Wikipedia> to create hover-card information directly integrated into your myst documents. The syntax follows standard markdown links, under the `wiki:` protocol followed by the page title[^1]. As with any other link, you can either follow a `[text](wiki:Page_Title)` or `<wiki:Page_Title>`, which if no text is provided for the links will be replaced with the page title.

[^1]: Replace any spaces in the page title with underscores.

```{myst}
Primordial <wiki:gravitational_waves> are hypothesized to arise from <wiki:cosmic_inflation>, a faster-than-light expansion just after the <wiki:big_bang>.
```

The links will take you to Wikipedia, as well as provide a tooltip and description directly on the page.

To show different text you can use a similar technique to references:\
`[my **bold** text](wiki:reference)`

```{myst}
* [big bang](wiki:The_Big_Bang_Theory)
* [](wiki:big_bang)
```

```{tip}
:class: dropdown
# Finding and formating the page title
To find the page title, browse Wikipedia and copy the last part of the URL, for example:\
`Page_Title` in `https://wikipedia.org/wiki/Page_Title`. If you do not supply text for the link specifically, then the case of the link will be preserved and shown without the underscores.

Usually the page titles resolve properly, so just try guessing when you are writing and then you can check them with the live hover preview.

Note that if the page title has spaces in it, simply replace them with underscores.
```

```{important}
:class: dropdown
# Different languages or wikis

There are many different official and unofficial wikis that use the same [Wikimedia](wiki:Wikimedia_Foundation) technology, including subdomains in various langauges.

Wikipedia links, like `https://fr.wikipedia.org/wiki/Croissant_(viennoiserie)` will work fine out of the box, and point to [](https://fr.wikipedia.org/wiki/Croissant_(viennoiserie)) with the popup still working!

% TODO: Allow the ability to set the default language to use on your MyST site. This is already possible in the transformers.

% TODO: Set the default wiki links, or an additional wiki link in references, e.g. to something like https://wiki.seg.org/wiki/Knowledge_tree
```

## GitHub Links

MyST can directly integrate with links to GitHub to create hover-card information directly integrated into your MyST documents. For example, a link to the [linkTransforms](https://github.com/executablebooks/mystjs/blob/78d16ee1a/packages/myst-transforms/src/links/plugin.ts#L12-L28) plugin code shows a preview of the code. The code preview works for both mutliple line numbers and higlighting [single lines](https://github.com/executablebooks/mystjs/blob/78d16ee1a/packages/myst-transforms/src/links/plugin.ts#L30), which shows the surrounding ten lines, with the referenced line highlighted. If you reference the [full file](https://github.com/executablebooks/mystjs/blob/78d16ee1a/packages/myst-transforms/src/links/plugin.ts) then the first ten lines of the file are shown in the preview.

````{important}
:class: dropdown
# Creating GitHub links to code
GitHub links to code can be generated on the GitHub web application when browsing code and click on the line numbers, then copy the URL. To select multiple lines, click your first line then shift-click to select multiple lines, the URL will be updated to end with `#L4-L6`. The structure of the link should look like:

```text
https://github.com/{{org}}/{{repo}}/blob/{{reference}}/file.py#L4-L6
```

Any git `reference` will work, however, picking a branch like `main` may mean that your code line numbers will change, instead, you may want to go to navigate to a specific git commit or tag, which will show up in the URL.
````

% TODO: Add ability to reference issues and PRs with queries for the issue names, and PR information.

## Linking DOIs

It is possible to include DOIs as external content, and they are also added as citations to your project and show up in the references section at the bottom of a document. See [](./citations.md) for more details, specifically [](#doi-links), which explains linking DOIs with the `<doi:10.5281/zenodo.6476040>` or `[](doi:10.5281/zenodo.6476040)` to create a citation, for example (<doi:10.5281/zenodo.6476040>).

## Research Resource Identifiers

{abbr}`RRID (Research Resource Identifiers)`s are persistent, unique identifiers for referencing a research resource, such as an antibody, plasmid, organism, or scientific tool. These are helpful for ensuring reproducibility and exact communication in scientific studies. See the [RRID website](https://scicrunch.org/resources) for more information.

MyST allows you to directly integrate with the RRID database to pull information and validate the links are correct as you are writing documents. The metadata is passed to subsequent systems (e.g. PDF documents, compatible journals and preprint servers) and helps keep your science reproducible.

To create an RRID link, use the `rrid:` protocol followed by the resource identifier, for example:

- `[](rrid:SCR_008394)` becomes [](rrid:SCR_008394)
- `<rrid:SCR_008394>` becomes <rrid:SCR_008394>

````{note}
# Example Methods Section

An edited excerpt from _Impaired speed encoding and grid cell periodicity in a mouse model of tauopathy_
{cite:p}`10.7554/eLife.59045`. The authors used Matlab (<rrid:SCR_001622>) in their analysis.

Click on one of the RRIDs below to see additional metadata!

```{list-table}
:header-rows: 1

* - Resource type
  - Designation
  - Source
  - Identifiers

* - Strain (M. musculus)
  - rTg4510, Tg(Camk2a-tTA)
  - ENVIGO
  - <rrid:MGI:4819951>

* - Software, algorithm
  - Klusta suite
  - {cite}`10.1038/nn.4268`
  - <rrid:SCR_014480>

* - Software, algorithm
  - MATLAB R2019b
  - [Mathworks](https://uk.mathworks.com/)
  - <rrid:SCR_001622>\
    <rrid:SCR_005547>

* - Software, algorithm
  - OriginPro 2019b
  - [OriginLab](https://www.originlab.com/)
  - <rrid:SCR_014212>
```
````
