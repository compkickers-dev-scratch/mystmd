import fs from 'fs';
import type { Root } from 'mdast';
import mime from 'mime-types';
import type { GenericNode } from 'myst-common';
import { isUrl } from 'myst-cli-utils';
import { selectAll } from 'unist-util-select';
import fetch from 'node-fetch';
import path from 'path';
import type { PageFrontmatter } from 'myst-frontmatter';
import {
  WebFileObject,
  addWarningForFile,
  computeHash,
  hashAndCopyStaticFile,
  imagemagick,
  inkscape,
} from '../utils';
import type { ISession } from '../session/types';
import chalk from 'chalk';

const DEFAULT_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

function isBase64(data: string) {
  return data.split(';base64,').length === 2;
}

function getGithubRawUrl(url?: string): string | undefined {
  const GITHUB_BLOB = /^(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)\/blob\//;
  if (!url?.match(GITHUB_BLOB)) return undefined;
  return url.replace(GITHUB_BLOB, 'https://raw.githubusercontent.com/$1/$2/');
}

export async function downloadAndSaveImage(
  session: ISession,
  url: string,
  file: string,
  fileFolder: string,
): Promise<string | undefined> {
  const exists = fs.existsSync(fileFolder);
  const fileMatch = exists && fs.readdirSync(fileFolder).find((f) => path.parse(f).name === file);
  if (exists && fileMatch) {
    session.log.debug(`Cached image found for: ${url}...`);
    return fileMatch;
  }
  const filePath = path.join(fileFolder, file);
  session.log.debug(`Fetching image: ${url}...\n  -> saving to: ${filePath}`);
  try {
    const github = getGithubRawUrl(url);
    const res = await fetch(github ?? url);
    const contentType = res.headers.get('content-type') || '';
    const extension = mime.extension(contentType);
    if (!extension || !contentType) throw new Error('No content-type for image found.');
    if (!contentType.startsWith('image/')) {
      throw new Error(`ContentType "${contentType}" is not an image`);
    }
    if (!fs.existsSync(fileFolder)) fs.mkdirSync(fileFolder, { recursive: true });
    // Write to a file
    const fileStream = fs.createWriteStream(`${filePath}.${extension}`);
    await new Promise((resolve, reject) => {
      if (!res.body) {
        reject(`no response body from ${url}`);
      } else {
        res.body.pipe(fileStream);
        res.body.on('error', reject);
        fileStream.on('finish', resolve);
      }
    });
    await new Promise((r) => setTimeout(r, 50));
    const fileName = `${file}.${extension}`;
    session.log.debug(`Image successfully saved to: ${fileName}`);
    return fileName;
  } catch (error) {
    session.log.debug(`\n\n${(error as Error).stack}\n\n`);
    session.log.error(`Error saving image "${url}": ${(error as Error).message}`);
    return undefined;
  }
}

function resolveOutputPath(file: string, writeFolder: string, altOutputFolder?: string) {
  if (altOutputFolder == null) {
    return path.join(writeFolder, file);
  }
  if (altOutputFolder.endsWith('/')) {
    return `${altOutputFolder}${file}`;
  }
  return path.join(altOutputFolder, file);
}

export async function saveImageInStaticFolder(
  session: ISession,
  urlSource: string,
  sourceFile: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string },
): Promise<{ urlSource: string; url: string } | null> {
  const sourceFileFolder = path.dirname(sourceFile);
  const imageLocalFile = path.join(sourceFileFolder, urlSource);
  let file: string | undefined;
  if (isUrl(urlSource)) {
    // If not oxa, download the URL directly and save it to a file with a hashed name
    file = await downloadAndSaveImage(session, urlSource, computeHash(urlSource), writeFolder);
  } else if (fs.existsSync(imageLocalFile)) {
    // Non-oxa, non-url local image paths relative to the config.section.path
    if (path.resolve(path.dirname(imageLocalFile)) === path.resolve(writeFolder)) {
      // If file is already in write folder, don't hash/copy
      file = path.basename(imageLocalFile);
    } else {
      file = hashAndCopyStaticFile(session, imageLocalFile, writeFolder);
    }
    if (!file) return null;
  } else if (isBase64(urlSource)) {
    // Inline base64 images
    const fileObject = new WebFileObject(session.log, writeFolder, '', true);
    await fileObject.writeBase64(urlSource);
    file = fileObject.id;
  } else {
    const message = `Cannot find image "${urlSource}" in ${sourceFileFolder}`;
    addWarningForFile(session, sourceFile, message, 'error');
    return null;
  }
  // Update mdast with new file name
  const url = resolveOutputPath(file as string, writeFolder, opts?.altOutputFolder);
  return { urlSource, url };
}

export async function transformImages(
  session: ISession,
  mdast: Root,
  file: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string },
) {
  const images = selectAll('image', mdast) as GenericNode[];
  return Promise.all(
    images.map(async (image) => {
      const result = await saveImageInStaticFolder(
        session,
        image.urlSource || image.url,
        file,
        writeFolder,
        {
          altOutputFolder: opts?.altOutputFolder,
        },
      );
      if (result) {
        // Update mdast with new file name
        const { urlSource, url } = result;
        image.urlSource = urlSource;
        image.url = url;
      }
    }),
  );
}

type ConversionFn = (session: ISession, svg: string, writeFolder: string) => Promise<string | null>;

export async function transformImageFormats(
  session: ISession,
  mdast: Root,
  file: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string; imageExtensions?: string[] },
) {
  const images = selectAll('image', mdast) as GenericNode[];
  // Ignore all images with supported extension types
  const validExts = opts?.imageExtensions ?? DEFAULT_IMAGE_EXTENSIONS;
  const unsupportedImages = images.filter((image) => {
    return !validExts.includes(path.extname(image.url));
  });
  if (unsupportedImages.length === 0) return;

  // Gather unsupported SVG & GIF images that may be converted to supported types
  const svgImages: GenericNode[] = [];
  const gifImages: GenericNode[] = [];
  const unconvertableImages: GenericNode[] = [];

  const allowConvertedSvg = validExts.includes('.png') || validExts.includes('.pdf');
  const allowConvertedGif = validExts.includes('.png');

  unsupportedImages.forEach((image) => {
    if (allowConvertedSvg && path.extname(image.url) === '.svg') {
      svgImages.push(image);
    } else if (allowConvertedGif && path.extname(image.url) == '.gif') {
      gifImages.push(image);
    } else {
      unconvertableImages.push(image);
    }
  });

  const conversionPromises: Promise<void>[] = [];
  const convert = async (image: GenericNode, conversionFn: ConversionFn) => {
    const inputFile = path.join(writeFolder, path.basename(image.url));
    const outputFile = await conversionFn(session, inputFile, writeFolder);
    if (outputFile) {
      // Update mdast with new file name
      image.url = resolveOutputPath(outputFile, writeFolder, opts?.altOutputFolder);
      session.log.debug(`Successfully converted ${inputFile} -> ${image.url}`);
    } else {
      session.log.debug(`Failed to convert ${inputFile}`);
    }
  };

  const inkscapeAvailable = inkscape.isInkscapeAvailable();
  const imagemagickAvailable = imagemagick.isImageMagickAvailable();

  // Convert SVGs
  let svgConversionFn: ConversionFn | undefined;
  if (svgImages.length) {
    // Decide if we convert to PDF or PNG
    const pngIndex = validExts.indexOf('.png');
    const pdfIndex = validExts.indexOf('.pdf');
    const svgToPdf = pdfIndex !== -1 && (pngIndex === -1 || pdfIndex < pngIndex);
    const svgToPng = !svgToPdf || !inkscapeAvailable;
    const logPrefix = `🌠 Converting ${svgImages.length} SVG image${
      svgImages.length > 1 ? 's' : ''
    } to`;
    if (svgToPdf && inkscapeAvailable) {
      session.log.info(`${logPrefix} PDF using inkscape`);
      svgConversionFn = inkscape.convertSvgToPdf;
    } else if (svgToPng && inkscapeAvailable) {
      session.log.info(`${logPrefix} PNG using inkscape`);
      svgConversionFn = inkscape.convertSvgToPng;
    } else if (svgToPng && imagemagickAvailable) {
      if (svgToPdf) {
        addWarningForFile(
          session,
          file,
          `To convert SVG images to PDF, you must install inkscape.\n${chalk.dim(
            'Images converted to PNG as a fallback using imagemagick.',
          )}`,
        );
      }
      session.log.info(`${logPrefix} PNG using imagemagick`);
      svgConversionFn = imagemagick.convertSvgToPng;
    } else {
      addWarningForFile(
        session,
        file,
        `Cannot convert SVG images, they may not correctly render.\n${chalk.dim(
          'To convert these images, you must install imagemagick or inkscape',
        )}`,
        'error',
      );
    }
    if (svgConversionFn) {
      conversionPromises.push(
        ...svgImages.map(async (image) => await convert(image, svgConversionFn as ConversionFn)),
      );
    }
  }

  // Convert GIFs
  let gifConversionFn: ConversionFn | undefined;
  if (gifImages.length) {
    if (imagemagickAvailable) {
      session.log.info(
        `🌠 Converting ${gifImages.length} GIF image${
          gifImages.length > 1 ? 's' : ''
        } to PNG using imagemagick`,
      );
      gifConversionFn = imagemagick.extractFirstFrameOfGif;
    } else {
      addWarningForFile(
        session,
        file,
        'Cannot convert GIF images, they may not correctly render.\nTo convert these images, you must install imagemagick',
        'error',
      );
    }
    if (gifConversionFn) {
      conversionPromises.push(
        ...gifImages.map(async (image) => await convert(image, gifConversionFn as ConversionFn)),
      );
    }
  }

  // Warn on unsupported, unconvertable images
  if (unconvertableImages.length) {
    const badExts = [
      ...new Set(unconvertableImages.map((image) => path.extname(image.url) || '<no extension>')),
    ];
    addWarningForFile(
      session,
      file,
      `Unsupported image extension${
        badExts.length > 1 ? 's' : ''
      } may not correctly render: ${badExts.join(', ')}`,
      'error',
    );
  }
  return Promise.all(conversionPromises);
}

export async function transformThumbnail(
  session: ISession,
  mdast: Root,
  file: string,
  frontmatter: PageFrontmatter,
  writeFolder: string,
  opts?: { altOutputFolder?: string },
) {
  let thumbnail = frontmatter.thumbnail;
  // If the thumbnail is explicitly null, don't add an image
  if (thumbnail === null) {
    session.log.debug(`${file}#frontmatter.thumbnail is explicitly null, not searching content.`);
    return;
  }
  if (!thumbnail) {
    // The thumbnail isn't found, grab it from the mdast
    const [image] = selectAll('image', mdast) as GenericNode[];
    if (!image) {
      session.log.debug(`${file}#frontmatter.thumbnail is not set, and there are no images.`);
      return;
    }
    session.log.debug(`${file}#frontmatter.thumbnail is being populated by the first image.`);
    thumbnail = image.urlSource || image.url;
  }
  if (!thumbnail) return;
  session.log.debug(`${file}#frontmatter.thumbnail Saving thumbnail in static folder.`);
  const result = await saveImageInStaticFolder(session, thumbnail, file, writeFolder, {
    altOutputFolder: opts?.altOutputFolder,
  });
  if (result) {
    // Update frontmatter with new file name
    const { url } = result;
    frontmatter.thumbnail = url;
  }
}
