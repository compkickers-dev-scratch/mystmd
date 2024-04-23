import fs from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import type { GenericNode, GenericParent } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { updateLinkTextIfEmpty } from 'myst-transforms';
import type { LinkTransformer, Link } from 'myst-transforms';
import { RuleId, fileError, plural } from 'myst-common';
import { computeHash, hashAndCopyStaticFile, tic, writeFileToFolder } from 'myst-cli-utils';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { links } from '../store/reducers.js';
import type { ExternalLinkResult } from '../store/types.js';
import { EXT_REQUEST_HEADERS } from '../utils/headers.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';

// These limit access from command line tools by default
const skippedDomains = [
  'www.linkedin.com',
  'linkedin.com',
  'medium.com',
  'twitter.com',
  'en.wikipedia.org',
];

function checkLinkCacheFile(session: ISession, url: string) {
  const filename = `checkLink-${computeHash(url)}.json`;
  return path.join(session.buildPath(), 'cache', filename);
}

function writeLinkCache(session: ISession, link: ExternalLinkResult) {
  session.log.debug(`Writing successful link check to cache file for "${link.url}"`);
  writeFileToFolder(checkLinkCacheFile(session, link.url), JSON.stringify(link, null, 2));
}

function loadLinkCache(session: ISession, url: string) {
  const cacheFile = checkLinkCacheFile(session, url);
  if (!fs.existsSync(cacheFile)) return;
  session.log.debug(`Using cached success for "${url}"`);
  return JSON.parse(fs.readFileSync(cacheFile).toString());
}

export async function checkLink(session: ISession, url: string): Promise<ExternalLinkResult> {
  const cached = selectors.selectLinkStatus(session.store.getState(), url);
  if (cached) return cached;
  const link: ExternalLinkResult = {
    url,
  };
  if (url.startsWith('mailto:')) {
    link.skipped = true;
    session.log.debug(`Skipping: ${url}`);
    session.store.dispatch(links.actions.updateLink(link));
    return link;
  }
  try {
    const parsedUrl = new URL(url);
    if (skippedDomains.includes(parsedUrl.hostname)) {
      link.skipped = true;
      session.log.debug(`Skipping: ${url}`);
      session.store.dispatch(links.actions.updateLink(link));
      return link;
    }
    session.log.debug(`Checking that "${url}" exists`);
    const linkCache = loadLinkCache(session, url);
    const resp = linkCache ?? (await session.fetch(url, { headers: EXT_REQUEST_HEADERS }));
    link.ok = resp.ok;
    link.status = resp.status;
    link.statusText = resp.statusText;
    if (link.ok && !linkCache) {
      writeLinkCache(session, link);
    }
  } catch (error) {
    session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
    session.log.debug(`Error fetching ${url} ${(error as Error).message}`);
    link.ok = false;
  }
  session.store.dispatch(links.actions.updateLink(link));
  return link;
}

type LinkInfo = {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
};

export type LinkLookup = Record<string, LinkInfo>;

/**
 * Compute link node file path relative to site root (currently, only the working directory)
 *
 * If path has no extension, this function looks for .md then .ipynb.
 * If a '#target' is present at the end of the path, it is maintained.
 * If file does not exists, returns undefined.
 *
 * @param pathFromLink Path from link node URL relative to file where it is defined
 * @param file File where link is defined
 * @param sitePath Root path of site / session; from here all relative paths in the store are defined
 */
export function fileFromRelativePath(
  pathFromLink: string,
  file?: string,
  sitePath?: string,
): string | undefined {
  let target: string[];
  [pathFromLink, ...target] = pathFromLink.split('#');
  // The URL is encoded (e.g. %20 --> space)
  pathFromLink = decodeURIComponent(pathFromLink);
  if (!sitePath) sitePath = '.';
  if (file) {
    pathFromLink = path.relative(sitePath, path.resolve(path.dirname(file), pathFromLink));
  }
  if (fs.existsSync(pathFromLink) && fs.lstatSync(pathFromLink).isDirectory()) {
    // This should only return true for files
    return undefined;
  }
  if (!fs.existsSync(pathFromLink)) {
    if (fs.existsSync(`${pathFromLink}.md`)) {
      pathFromLink = `${pathFromLink}.md`;
    } else if (fs.existsSync(`${pathFromLink}.ipynb`)) {
      pathFromLink = `${pathFromLink}.ipynb`;
    } else {
      return undefined;
    }
  }
  return [pathFromLink, ...target].join('#');
}

export class StaticFileTransformer implements LinkTransformer {
  protocol = 'file';
  session: ISession;
  filePath: string;

  constructor(session: ISession, filePath: string) {
    this.session = session;
    this.filePath = filePath;
  }

  test(url?: string) {
    if (!url) return false;
    const linkFileWithTarget = fileFromRelativePath(url, this.filePath);
    return !!linkFileWithTarget;
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    const linkFileWithTarget = fileFromRelativePath(urlSource, this.filePath);
    if (!linkFileWithTarget) {
      // Not raising a warning here, this should be caught in the test above
      return false;
    }
    const [linkFile, ...target] = linkFileWithTarget.split('#');
    const { url, title, dataUrl } =
      selectors.selectFileInfo(this.session.store.getState(), linkFile) || {};
    // If the link is non-static, and can be resolved locally
    if (url != null && link.static !== true) {
      // Replace relative file link with resolved site path
      // TODO: lookup the and resolve the hash as well
      link.url = [url, ...(target || [])].join('#');
      link.internal = true;
      if (dataUrl) link.dataUrl = dataUrl;
    } else {
      // Copy relative file to static folder and replace with absolute link
      const copiedFile = hashAndCopyStaticFile(
        this.session,
        linkFile,
        this.session.publicPath(),
        (m: string) => {
          fileError(file, m, {
            node: link,
            source: 'StaticFileTransformer',
            ruleId: RuleId.staticFileCopied,
          });
        },
      );
      if (!copiedFile) return false;
      link.url = `/${copiedFile}`;
      link.static = true;
    }
    updateLinkTextIfEmpty(link, title || path.basename(linkFile));
    return true;
  }
}

const limitOutgoingConnections = pLimit(25);

export async function checkLinksTransform(
  session: ISession,
  file: string,
  mdast: GenericParent,
): Promise<string[]> {
  const linkNodes = (selectAll('link,linkBlock,card', mdast) as GenericNode[]).filter(
    (link) => !(link.internal || link.static),
  );
  if (linkNodes.length === 0) return [];
  const toc = tic();
  session.log.info(`🔗 Checking ${plural('%s link(s)', linkNodes)} in ${file}`);
  const linkResults = await Promise.all(
    linkNodes.map(async (link) =>
      limitOutgoingConnections(async () => {
        const { position, url } = link;
        const check = await checkLink(session, url);
        if (check.ok || check.skipped) return url as string;
        const status = check.status ? ` (${check.status}, ${check.statusText})` : '';
        addWarningForFile(session, file, `Link for "${url}" did not resolve.${status}`, 'error', {
          position,
          ruleId: RuleId.linkResolves,
          key: url,
        });
        return url as string;
      }),
    ),
  );
  session.log.info(toc(`🔗 Checked ${plural('%s link(s)', linkNodes)} in ${file} in %s`));
  return linkResults;
}
