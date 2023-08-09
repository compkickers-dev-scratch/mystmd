import { getFrontmatter } from 'myst-transforms';
import type { Export, ExportFormats, Licenses, PageFrontmatter } from 'myst-frontmatter';
import {
  validateExportsList,
  fillPageFrontmatter,
  licensesToString,
  unnestKernelSpec,
  validatePageFrontmatter,
} from 'myst-frontmatter';
import type { GenericParent } from 'myst-common';
import { copyNode } from 'myst-common';
import type { ValidationOptions } from 'simple-validators';
import { VFile } from 'vfile';
import { castSession } from './session/index.js';
import { loadFile } from './process/index.js';
import type { ISession } from './session/types.js';
import { selectors } from './store/index.js';
import { logMessagesFromVFile } from './index.js';

/**
 * Get page frontmatter from mdast tree and fill in missing info from project frontmatter
 *
 * @param session
 * @param path - project path for loading project config/frontmatter
 * @param tree - mdast tree already loaded from 'file'
 * @param file - file source for mdast 'tree' - this is only used for logging; tree is not reloaded
 * @param removeNode - if true, mdast tree will be mutated to remove frontmatter once read
 */
export function getPageFrontmatter(
  session: ISession,
  tree: GenericParent,
  file: string,
  path?: string,
  removeNode = true,
): PageFrontmatter {
  const vfile = new VFile();
  vfile.path = file;
  const { frontmatter: rawPageFrontmatter } = getFrontmatter(vfile, tree, {
    removeYaml: removeNode,
    removeHeading: removeNode,
    propagateTargets: true,
  });
  logMessagesFromVFile(session, vfile);
  unnestKernelSpec(rawPageFrontmatter);
  const pageFrontmatter = validatePageFrontmatter(rawPageFrontmatter, {
    property: 'frontmatter',
    file,
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: ${message}`);
    },
  });
  const frontmatter = processPageFrontmatter(session, pageFrontmatter, path);
  return frontmatter;
}

export function processPageFrontmatter(
  session: ISession,
  pageFrontmatter: PageFrontmatter,
  path?: string,
) {
  const state = session.store.getState();
  const siteFrontmatter = selectors.selectCurrentSiteConfig(state) ?? {};
  const projectFrontmatter = path ? selectors.selectLocalProjectConfig(state, path) ?? {} : {};

  const frontmatter = fillPageFrontmatter(pageFrontmatter, projectFrontmatter);

  if (siteFrontmatter?.design?.hide_authors) {
    delete frontmatter.authors;
  }
  return frontmatter;
}

export function prepareToWrite(frontmatter: { license?: Licenses }) {
  if (!frontmatter.license) return { ...frontmatter };
  return { ...frontmatter, license: licensesToString(frontmatter.license) };
}

export async function getRawFrontmatterFromFile(session: ISession, file: string) {
  const cache = castSession(session);
  await loadFile(session, file);
  const result = cache.$mdast[file];
  if (!result || !result.pre) return undefined;
  const vfile = new VFile();
  vfile.path = file;
  // Copy the mdast, this is not a processing step!
  const frontmatter = getFrontmatter(vfile, copyNode(result.pre.mdast));
  logMessagesFromVFile(session, vfile);
  return frontmatter.frontmatter;
}

export function getExportListFromRawFrontmatter(
  session: ISession,
  formats: ExportFormats[],
  rawFrontmatter: Record<string, any> | undefined,
  file: string,
): Export[] {
  const exportErrorMessages: ValidationOptions = {
    property: 'exports',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error for ${file}: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation for ${file}: ${message}`);
    },
  };
  const exports = validateExportsList(
    rawFrontmatter?.exports ?? rawFrontmatter?.export,
    exportErrorMessages,
  );
  if (!exports) return [];
  const exportOptions: Export[] = exports.filter(
    (exp: Export | undefined): exp is Export => !!exp && formats.includes(exp.format),
  );
  return exportOptions;
}
