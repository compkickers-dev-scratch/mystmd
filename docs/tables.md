# Tables

## Github Flavoured

Tables can be written using the standard [Github Flavoured Markdown syntax](https://github.github.com/gfm/#tables-extension-):

```{myst}
| foo | bar |
| --- | --- |
| baz | bim |
```

Cells in a column can be aligned using the `:` character:

```{myst}
| left | center | right |
| :--- | :----: | ----: |
| a    | b      | c     |
```

% TODO: The centering isn't working!?

## Adding a Caption

You can use the {myst:directive}`table` directive to add a caption to a markdown table.

```{myst}
:::{table} Table caption
:label: table
:align: center

| foo | bar |
| --- | --- |
| baz | bim |

:::
```

```{note}
You may have inline markdown in the table caption, however, if it includes backticks, you must use a [colon fence](#example-fence).
```


## List Tables

````{myst}
```{list-table} This table title
:header-rows: 1
:label: example-table

* - Training
  - Validation
* - 0
  - 5
* - 13720
  - 2744
```
````

## CSV Tables

````{myst}
```{csv-table} This table title
:header-rows: 1
:label: example-table

Training, Validation
0,        5
13720,    2744
```
````
## Notebook outputs as tables

You can embed Jupyter Notebook outputs as tables.
See [](reuse-jupyter-outputs.md) for more information.
