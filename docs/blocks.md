---
title: Blocks and Comments
short_title: Blocks & Comments
description: Blocks provide structural division in a MyST document using `+++`. These correspond, for example, to separate cells in a Jupyter Notebook. To add a comment, start your line with `%`.
---

## Blocks

`Blocks` provide a structural division of MyST documents using `+++`. These correspond, for example, to separate cells in a Jupyter Notebook. There can be optional metadata associated with the block, such as "tags", "parts" or other identifiers.

```{myst}
+++ {"cell": "one"}
cell 1
+++ {"meta": "data!"}
cell 2
```

```{tip}
To identify a [part of a document](./document-parts.md), like an abstract, use `+++ { "part": "abstract" }`, this will allow tools like the [](./creating-pdf-documents.md) to be created with the appropriate parts of information.
```

### Page Breaks

You may use `block` metadata to insert page breaks into your PDF or docx export with `+++ { "page-break": true }`. This will have no impact on your MyST site build nor other static exports that disregard "pages" (e.g. JATS).

```{tip}
You may also use `"new-page"` instead of `"page-break"`. This distinction only matters for $\LaTeX$ where `\newpage` and `\pagebreak` will be used, respectively.
```

## Comments

You may add comments by putting the `%` character at the beginning of a line. This will prevent the line from being shown in the output document.

```{myst}
This next line won't render, but it is in the HTML and LaTeX!
% Markdown comment line
```

```{warning} Comments only work at the beginning of lines
Note that a `%` is only a comment if it is at the beginning of a line, which is different than, for example, $\LaTeX$ where percent signs have to be escaped.
```

````{note} Comments split paragraphs
:class: dropdown
Putting a comment between items will split any preceding elements. For example, a comment between two lines of text will be broken up into two paragraphs, resulting in a margin between them:

```{myst}
a line
% a comment
another line
```
````
