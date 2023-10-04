---
title: Images, figures & videos
short_title: Images and videos
description: MyST Markdown allows you to create images and figures in your documents, including cross-referencing content throughout your pages.
thumbnail: ./thumbnails/figures.png
---

MyST Markdown can be used to include images and figures in your documents as well as referencing those images easily throughout your website, article or paper.

## Simple images

The simplest way to create an image is to use the standard Markdown syntax:

```md
![alt](link 'title')
```

You can explore a [demo of images](#md:image) in the discussion of [](./commonmark.md) features of MyST.

Using standard markdown to create an image will render across all output formats (HTML, TeX, Word, PDF, etc). However, this markdown syntax is limited in the configuration that can be applied beyond `alt` text and an optional `title`.

There are two directives that can be used to add additional information about the layout and metadata associated with an image. For example, {myst:directive}`image.width`, {myst:directive}`alignment <image.align>` or a {myst:directive}`figure caption <figure.body>`.

**image**
: The {myst:directive}`image` directive allows you to customize {myst:directive}`image.width`, {myst:directive}`alignment <image.align>`, and other {myst:directive}`classes <image.class>` to add to the image

**figure**
: The {myst:directive}`figure` directive can contain a {myst:directive}`figure caption <figure.body>` and allows you to cross-reference this in other parts of your document.

(image-directive)=

## Image directive

````{myst}
```{image} https://source.unsplash.com/random/500x150?sunset
:alt: Beautiful Sunset
:width: 500px
:align: center
```
````

(figure-directive)=

## Figure directive

````{myst}
```{figure} https://source.unsplash.com/random/400x200?beach,ocean
:name: myFigure
:alt: Random image of the beach or ocean!
:align: center

Relaxing at the beach 🏝 🌊 😎
```
````

```{note}
You may also embed [notebook cell outputs as images or figures](#targeting-cells).
```

## Supported Image Formats

MyST supports many images formats including `.png`, `.jpg`, `.gif`, `.tiff`, `.svg`, `.pdf`, and `.eps`.
Many of these image formats are easily supported for HTML themes including `.png`, `.jpg` and `.gif`. However, the raster image formats can be further optimized to [improve site performance](./accessibility-and-performance.md), MyST translates these to the modern `.webp` format while the site is building. The original file-format is also included your site, with a `srcset` and fallback for older web-browsers.

`````{tab-set}
````{tab-item} PNG
:::{figure} ./images/myst-image.png
:width: 50%
`.png` is natively supported in all exports. The image is converted to `.webp` for web-browsers.
:::
````

````{tab-item} JPG
:::{figure} ./images/myst-image.jpg
:width: 50%
`.jpg` or `.jpeg` is natively supported in all exports. The image is converted to `.webp` for web-browsers.
:::
````

````{tab-item} GIF
:::{figure} ./images/myst-image.gif
:width: 50%
`.gif` is supported web-browsers and Microsoft Word, the first frame is extracted for $\LaTeX$ and PDF exports. The image is converted to `.webp` for web-browsers.
:::
````

````{tab-item} TIFF
:::{figure} ./images/myst-image.tiff
:width: 50%
`.tiff` is not supported by most web-browsers, and is converted to `.png`. Microsoft Word, $\LaTeX$ and PDF exports can work with these `.png` images, which are also converted to `.webp` for web-browsers.
:::
````

````{tab-item} SVG
:::{figure} ./images/myst-image.svg
:width: 50%
`.svg` is supported by web-browsers and is not further optimized or rasterized. When exporting to $\LaTeX$ and PDF the images are translated to `.pdf` using `inkscape` or as a fallback to `.png` using `imagemagick`. Microsoft Word requires the `.png` export.
:::
````

````{tab-item} PDF
:::{figure} ./images/myst-image.pdf
:width: 50%
A `.pdf` image is not supported by web-browsers or Microsoft Word. The images are translated to `.png` using `imagemagick`. $\LaTeX$ and PDF use the `.pdf` image directly.
:::
````

````{tab-item} EPS
:::{figure} ./images/myst-image.eps
:width: 50%
An `.eps` image is not supported by web-browsers or Microsoft Word. The images are translated to `.png` using `imagemagick`. $\LaTeX$ and PDF use the `.eps` image directly.
:::
````
`````

### Image Transformers

There are formats that are not supported by web-browsers but are common in scientific writing like `.tiff`, `.pdf` and `.eps` for site builds, these are converted to `.svg` or `.png` as appropriate and available. For export to $\LaTeX$, PDF or Microsoft Word, the files are converted to an appropriate format that the export can handle (e.g. $\LaTeX$ can work directly with `.pdf` images). For animated images, `.gif`, the first frame is extracted for static exports.

:::{tip} Installing Image Converters
:class: dropdown
The image transforms and optimizations requires you to have the following packages installed:

- [imagemagik](https://imagemagick.org/) for conversion between raster formats
- [inkscape](https://inkscape.org/) for conversion between some vector formats
- [webp](https://developers.google.com/speed/webp) for image optimizations

:::

### Multiple Images

If you have manually converted your images or have different images for different formats, use an asterisk (`*`) as the extension. All images matching the provided pattern will be found and the best image out of the available candidates will be used for the export:

```text
![](./images/myst-image.*)
```

For example, when exporting to $\LaTeX$ the best format is a `.pdf` if it is available; in a web export, a `.webp` or `.svg` will be chosen before a `.png`. In all cases, if an appropriate format is not available the image will be translated.

## Videos

To embed a video you can either use a video platforms embed script or directly embed an `mp4` video file. For example, the

```markdown
:::{figure} ./videos/links.mp4
An embedded video with a caption!
:::

or

![](./videos/links.mp4)
```

Will copy the video to your static files and embed a video in your HTML output.

:::{figure} ./videos/links.mp4
An embedded video with a caption!
:::

These videos can also be used in the [image](#image-directive) or even in simple [Markdown image](#md:image).

:::{note} Videos are not currently transformed
:class: dropdown
The videos are not currently converted to static images when you export to PDF or Word.
If you want to help out with this feature, please get in touch!
:::

## YouTube Videos

If your video is on a platform like YouTube or Vimeo, you can use the {myst:directive}`iframe` directive that takes the URL of the video.

```{myst}
:::{iframe} https://www.youtube.com/embed/F3st8X0L1Ys
:width: 100%
Get up and running with MyST in Jupyter!
:::
```

You can find this URL when clicking share > embed on various platforms. You can also give the {myst:directive}`iframe` directive {myst:directive}`iframe.width` and a {myst:directive}`caption <iframe.body>`.
