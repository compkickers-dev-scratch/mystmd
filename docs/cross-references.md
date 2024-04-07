---
title: Cross-references
subtitle: Link to equations, figures, tables, and so much more!
description: Create numbered cross-references to labeled content (e.g. a figure, document, or table) and automatically generates links with hover previews.
thumbnail: ./thumbnails/cross-references.png
numbering:
  heading_1: true
  heading_2: true
---

% Based loosely on https://jupyterbook.org/content/references.html

References refer to labeled content (e.g. a figure, document or table) and automatically generates links and extra information, like numbering. This page covers the basics of setting up references to content and shows examples for sections, figures, tables and equations.

```{seealso}
See [](./external-references.md) to connect your <wiki:documents> to external [linked](wiki:Hyperlink) content like <wiki:Wikipedia>, which allow for [hover](wiki:Hovercraft)-references with external content.

See [](./citations.md) to cite scholarly work and create bibliographies.
```

## Directive Targets

Targets are custom anchors that you can refer to elsewhere, for example, a figure, section, table, program, or proof. To be referenced, they must have a `label`/`identifier` pair [in the AST](myst:spec#association). These can be created by setting the `label` option in many directives. For example, to label and reference a figure, use the following syntax:

% TODO: fix equation label redundancy here would nice to be able to simplify the onboarding (just use label, same as tex and ast)

````{myst}
```{figure} https://source.unsplash.com/random/500x200/?mountain
:label: my-fig
:align: center

My **bold** mountain 🏔🚠.
```

Check out [](#my-fig)!!
````

```{tip} Using Markdown Links 🔗
You can use this syntax to also reference [Section/Header targets](#targeting-headers) as well as [label equations](#targeting-equations) when using [dollar math](#dollar-math) or [AMS math](#ams-environments).
```

(link-references)=

## Referencing using Links

Cross-referencing content is accomplished with markdown link syntax (`[text](#target)`) where `#target` is the target label[^1], like the figure, equation or section header that you are referencing. If you leave the text empty, MyST will fill in the link with the title, caption, document name, or equation number as appropriate (e.g. "Figure 1" or "Section 1.3.7"). If you do supply text, you can control what is displayed in the reference, as well as have access to placing the name and enumerator of the target, using `{name}` and `{number}`, respectively[^2].

[^1]: Note that targets without the `#` will resolve, however, they throw a deprecation warning. By including the `#` there is a better chance of your content working in other markdown renderers like GitHub or VSCode.
[^2]: Note that not everything has a number or name (e.g. a paragraph usually isn't numbered, and an equation doesn't have text to resolve into `{name}`). An unnumbered node will resolve to `??`, and raise a warning if they are not defined. If no `{name}` is defined the node `label` will be used instead.

```{list-table}
:header-rows: 1
* - MyST Syntax
  - Rendered
* - `[](#targeting-headers)`
    : Default for numbered references is to fill in the listing and number (e.g. Figure 1.).
    : Note that headings are numbered on this page, so it will show the number rather than the header title.
  - [](#targeting-headers)
* - `[Sec. %s](#targeting-headers)`
    : Modify the title, but keep the enumerator, you can use `{number}` or `%s` to place the number.
    : Note that unnumbered targets (e.g. a paragraph) will resolve the number to `??`, similar to $\LaTeX$, and a warning shown.
  - [Sec. %s](#targeting-headers)
* - `[Sec. **_%s_**](#targeting-headers)`
    : Markup is parsed first and then the content in placed.
    : Content inside of inlineCode is _not_ replaced.
  - [Sec. **_%s_**](#targeting-headers)
* - `[Section "{name}"](#targeting-headers)`
    : Use `{name}` to place the name of the header in the content.
    : Headers resolve the text of the header, if there is a caption in the target it will be used.
    : For targets that do not have a caption or header, the name will resolve to the label.
  - [Section "{name}"](#targeting-headers)
* - `[**bold _reference_**](#targeting-headers)`
    : If you override the text in the link, that will be used.
  - [**bold _reference_**](#targeting-headers)
* - `[](./citations.md)`
    : Link to documents using relative links from the markdown.
  - [](./citations.md)
* - `[](./_toc.yml)`
    : Link to static files that will be included in your built website. Similar to the [{download}](#download-role) role.
  - [](./_toc.yml)
```

% TODO: absolute links

:::{seealso} Using roles for referencing
:class: dropdown

It is also possible to use specific roles to reference content, including ([ref](#ref-role), [numref](#numref-role), [eq](#eq-role) or [doc](#doc-role)), depending on your use-case.

These roles are supported to have compatibility with Sphinx. However, it is recommended to use markdown link syntax for referencing content, as it is more portable, is more concise, and has improved features such as inline formatting in the text links.
:::

(targeting-headers)=

## Header Targets

To add labels to a header use `(my-section)=` before the header, these can then be used in markdown links and `{ref}` roles. This is helpful if you want to quickly insert links to other parts of your book. Referencing a heading will show the heading and the subsequent two pieces of content[^3], unless a header is encountered.

[^3]: The content could be a single paragraph, a figure, table or list. It can also be fully interactive content, with cross-references to other content, allowing you to nest and follow references easily!

```{myst}
(my-section)=
#### Header _Targets_

Use `(label)=` before the element that you want to target, then reference content with:

* [](#my-section)
```

:::{tip} How to turn on heading `numbering`
:class: dropdown

By default headings are not numbered, see [](#header-numbering) for more information. To turn on numbered headers you need to turn numbering on in the document or project using `numbering` in the frontmatter. You can control this for each heading level:

```yaml
numbering:
  heading_1: true
  heading_2: true
```

These will show up, for example, as `Section 1` and `Section 2.1`. To turn on all heading numbering, use `headings: true`.
:::

% TODO: We should support pandoc style unnumbered {-} and {.class, #id} syntax

(header-numbering)=

## Header Numbering

By default section numbering for headers is turned off with numbering for figure and table numbering enabled.
To turn on `numbering` for headers, you can can change the frontmatter in the document or project. See [](#numbering) for more details on the numbering object.

```{myst}

---
numbering:
  heading_2: true
  heading_3: true
---

(my-chapter)=
## My Chapter

(my-section)=
### My Section

(my-section2)=
### My Second Section

* [](#my-chapter)
* [](#my-section)
* [](#my-section2)
```

(targeting-equations)=

## Equations Targets

To reference equations, use the `{eq}` role. It will automatically insert the number of the equation. Note that you cannot modify the text of equation links.

(example-equation-targets)=

````{myst}
```{math}
:label: my-math-label
e=mc^2
```

See [](#my-math-label) for an equation!
````

% Internal/external links
% Checking for missing references, link to another place.

(targeting-cells)=

## Notebook Cell Targets

You can label notebook cells using a comment at the top of the cell, using a `#| label:` syntax, or have this added directly in the notebook metadata for the cell.

```python
#| label: my-cell
print('hello world')
```

The cell output or the entire cell can be embedded or referred to using the image or link syntax.

```markdown
[](#my-cell) - This is a cross-reference to a notebook cell
![](#my-cell) - This will embed the output of a notebook cell
```

or as a `figure` directive, where you can then add a caption. If you are referring to that figure in a further cross reference that figure (i.e. not the original cell), give it a new `name`.

```markdown
:::{figure} #my-cell
:label: fig-my-cell
:::
```

:::{card} ♻️ See Also: Reusing Jupyter Outputs
:link: ./reuse-jupyter-outputs.md
See more about reusing Jupyter outputs in figures, adding placeholders, and other options.
:::

:::{note} Interactive Example

The following example embeds a figure from [](./interactive-notebooks.ipynb), and can be used in cross references [](#fig-altair-horsepower).

```{figure} #altair-horsepower
:label: fig-altair-horsepower
This figure has been included from [](./interactive-notebooks.ipynb) and can be referred to in cross-references through a different label.
```

:::

(label-anything)=

## Label Anything

It is possible to label any document node by adding `(my-label)=` before any other block of content. These can be referenced using the `{ref}` role, but by default will not be enumerated, so you cannot use `%s` or `{number}` in the content.

```{myst}
(my-paragraph)=
This is just a paragraph!

(my-points)=
* Bullet
* points

Please see [this paragraph](#my-paragraph) and [these points](#my-points).
```

## Referencing using Roles

:::{warning} Coming from Sphinx?
The following sections are to support users who are coming from using Sphinx as a parsing engine, which has many different ways to reference and label content.

These ways of referencing content are not recommended, as they have certain drawbacks and are not consistent.

See [{name}](#link-references) for ways to use markdown link, `[](#target)` syntax to reference your content.
:::

(ref-role)=

ref
: The `{ref}` role can be used to bring the title or caption directly in line, the role can take a single argument which is the label, for example, `` {ref}`reference-target` ``
: You can also choose the reference text directly (not taking from the title or caption) by using, `` {ref}`your text here <reference-target>` ``.

(numref-role)=

numref
: The `{numref}` role is exactly the same as the above `{ref}` role, but also allows you to use a `%s` in place of the number, which will get filled in when the content is rendered. For example, ``{numref}`Custom Table %s text <my-table-ref>`.`` will become `Custom Table 3 text`.

(eq-role)=

eq
: The `` {eq}`my-equation` `` syntax creates a numbered link to the equation, which is equivalent to `[](#my-equation)` as there is no text content to fill in a title or caption.

(doc-role)=

doc
: The `` {doc}`./my-file.md` `` syntax creates a link to the document, which is equivalent to `[](./my-file.md)`.

(download-role)=

download
: The `` {download}`./my-file.zip` `` syntax creates a download to a document, which is equivalent to `[](./my-file.zip)`.

(numbering)=

## Numbering

Frontmatter may specify `numbering` to customize how various components of the page are numbered. By default, numbering is enabled for figures, equations, tables, and code blocks; it is disabled for headings and other content types contained on the page.

To enable numbering of all content, you may simply use:

```yaml
numbering: true
```

Similarly, to disable all numbering:

```yaml
numbering: false
```

The `numbering` object allows you to be much more granular with enabling and disabling specific components:

```yaml
numbering:
  code: false
  headings: true
```

For components with numbering enabled you may specify `start` to begin counting at a number other than 1 and `template` to redefine how the component will render when referenced in the text. For this example, the figures on the page will start with `Figure 5` and when referenced in the text they will appear as "fig (5)"

```yaml
numbering:
  figure:
    start: 5
    template: fig (%s)
```

Numbering may be used for `figure` as above, as well as `subfigure`, `equation`, `subequation`, `table`, `code`, `headings` (for all heading depths), and `heading_1` through `heading_6` (for modifying each depth separately).

You may also add numbering for custom content kinds:

```markdown
---
numbering:
  box:
    enabled: true
---

:::{figure} image.png
:label: my-box
:kind: box

This figure will be numbered as "Box 1"
:::
```

Finally, under the `numbering` object, you may specify `enumerator`. For now, this applies to all numberings on the page. Instead of enumerating as simply 1, 2, 3... they will follow the template set in `enumerator`. For example, in Appendix 1, you may want to use the following `numbering` so content is enumerated as A1.1, A1.2, A1.3...

```yaml
numbering:
  enumerator: A1.%s
```