import fs from 'node:fs';
import { join, parse } from 'node:path';
import { RuleId } from 'myst-common';
import type { ISession } from '../session/types.js';
import type { JupyterBookChapter } from '../utils/toc.js';
import { readTOC, tocFile } from '../utils/toc.js';
import { VALID_FILE_EXTENSIONS, resolveExtension } from '../utils/resolveExtension.js';
import { fileInfo } from '../utils/fileInfo.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { nextLevel } from '../utils/nextLevel.js';
import type {
  PageLevels,
  LocalProjectFolder,
  LocalProjectPage,
  LocalProject,
  PageSlugs,
} from './types.js';

function pagesFromChapters(
  session: ISession,
  path: string,
  chapters: JupyterBookChapter[],
  pages: (LocalProjectFolder | LocalProjectPage)[] = [],
  level: PageLevels = 1,
  pageSlugs: PageSlugs,
): (LocalProjectFolder | LocalProjectPage)[] {
  const filename = tocFile(path);
  const { dir } = parse(filename);
  chapters.forEach((chapter) => {
    // TODO: support globs and urls
    const file = chapter.file ? resolveExtension(join(dir, chapter.file)) : undefined;
    if (file) {
      const { slug } = fileInfo(file, pageSlugs);
      pages.push({ file, level, slug });
    }
    if (!file && chapter.file) {
      addWarningForFile(
        session,
        tocFile(path),
        `Referenced file not found: ${chapter.file}`,
        'error',
        { ruleId: RuleId.tocContentsExist },
      );
    }
    if (!file && chapter.title) {
      pages.push({ level, title: chapter.title });
    }
    if (chapter.sections) {
      pagesFromChapters(session, path, chapter.sections, pages, nextLevel(level), pageSlugs);
    }
  });
  return pages;
}

/**
 * Build project structure from jupyterbook '_toc.yml' file on a path
 *
 * Starting level may be provided; by default this is 1. Numbers up to
 * 6 may be provided for pages to start at a lower level. Level may
 * also be -1 or 0. In these cases, the first "part" level will be -1
 * and the first "chapter" level will be 0; However, "sections"
 * will never be level < 1.
 */
export function projectFromToc(
  session: ISession,
  path: string,
  level: PageLevels = 1,
): Omit<LocalProject, 'bibliography'> {
  const filename = tocFile(path);
  if (!fs.existsSync(filename)) {
    throw new Error(`Could not find TOC "${filename}". Please create a '_toc.yml'.`);
  }
  const { dir, base } = parse(filename);
  const toc = readTOC(session.log, { filename: base, path: dir });
  const pageSlugs: PageSlugs = {};
  const indexFile = resolveExtension(join(dir, toc.root));
  if (!indexFile) {
    throw Error(
      `The table of contents defined in "${tocFile(path)}" could not find file "${
        toc.root
      }" defined as the "root:" page. Please ensure that one of these files is defined:\n- ${VALID_FILE_EXTENSIONS.map(
        (ext) => join(dir, `${toc.root}${ext}`),
      ).join('\n- ')}\n`,
    );
  }
  const { slug } = fileInfo(indexFile, pageSlugs);
  const pages: (LocalProjectFolder | LocalProjectPage)[] = [];
  if (toc.sections) {
    // Do not allow sections to have level < 1
    if (level < 1) level = 1;
    pagesFromChapters(session, path, toc.sections, pages, level, pageSlugs);
  } else if (toc.chapters) {
    // Do not allow chapters to have level < 0
    if (level < 0) level = 0;
    pagesFromChapters(session, path, toc.chapters, pages, level, pageSlugs);
  } else if (toc.parts) {
    // Do not allow parts to have level < -1
    if (level < -1) level = -1;
    toc.parts.forEach((part, index) => {
      if (part.caption) {
        pages.push({ title: part.caption || `Part ${index + 1}`, level });
      }
      if (part.chapters) {
        pagesFromChapters(session, path, part.chapters, pages, nextLevel(level), pageSlugs);
      }
    });
  }
  return { path: dir || '.', file: indexFile, index: slug, pages };
}

/**
 * Return only project pages/folders from a '_toc.yml' file
 *
 * The root file is converted into just another top-level page.
 */
export function pagesFromToc(
  session: ISession,
  path: string,
  level: PageLevels,
): (LocalProjectFolder | LocalProjectPage)[] {
  const { file, index, pages } = projectFromToc(session, path, nextLevel(level));
  pages.unshift({ file, slug: index, level });
  return pages;
}
