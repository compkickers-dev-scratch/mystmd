import fs from 'fs';
import path from 'path';
import { hashAndCopyStaticFile } from 'myst-cli-utils';
import { TemplateOptionType } from 'myst-common';
import type { SiteAction, SiteManifest, SiteTemplateOptions } from 'myst-config';
import { PROJECT_FRONTMATTER_KEYS, SITE_FRONTMATTER_KEYS } from 'myst-frontmatter';
import type MystTemplate from 'myst-templates';
import { filterKeys } from 'simple-validators';
import type { ISession } from '../../session/types';
import type { RootState } from '../../store';
import { selectors } from '../../store';
import { getMystTemplate } from './template';

/**
 * Convert local project representation to site manifest project
 *
 * This does a couple things:
 * - Adds projectSlug (which locally comes from site config)
 * - Removes any local file references
 * - Adds validated frontmatter
 */
export async function localToManifestProject(
  session: ISession,
  projectPath: string,
  projectSlug: string,
) {
  const state = session.store.getState();
  const projConfig = selectors.selectLocalProjectConfig(state, projectPath);
  const proj = selectors.selectLocalProject(state, projectPath);
  if (!proj) return null;
  // Update all of the page title to the frontmatter title
  const { index } = proj;
  const projectTitle =
    projConfig?.title || selectors.selectFileInfo(state, proj.file).title || proj.index;
  const pages = await Promise.all(
    proj.pages.map(async (page) => {
      if ('file' in page) {
        const fileInfo = selectors.selectFileInfo(state, page.file);
        const title = fileInfo.title || page.slug;
        const short_title = fileInfo.short_title ?? undefined;
        const description = fileInfo.description ?? '';
        const thumbnail = fileInfo.thumbnail ?? '';
        const thumbnailOptimized = fileInfo.thumbnailOptimized ?? '';
        const date = fileInfo.date ?? '';
        const tags = fileInfo.tags ?? [];
        const { slug, level } = page;
        const projectPage: Required<SiteManifest>['projects'][0]['pages'][0] = {
          slug,
          title,
          short_title,
          description,
          date,
          thumbnail,
          thumbnailOptimized,
          tags,
          level,
        };
        return projectPage;
      }
      return { ...page };
    }),
  );

  const projFrontmatter = projConfig ? filterKeys(projConfig, PROJECT_FRONTMATTER_KEYS) : {};
  return {
    ...projFrontmatter,
    bibliography: projFrontmatter.bibliography || [],
    title: projectTitle || 'Untitled',
    slug: projectSlug,
    index,
    pages,
  };
}

async function resolveTemplateFileOptions(
  session: ISession,
  mystTemplate: MystTemplate,
  options: SiteTemplateOptions,
) {
  const resolvedOptions = { ...options };
  mystTemplate.getValidatedTemplateYml().options?.forEach((option) => {
    if (option.type === TemplateOptionType.file && options[option.id]) {
      const fileHash = hashAndCopyStaticFile(session, options[option.id], session.publicPath());
      resolvedOptions[option.id] = `/${fileHash}`;
    }
  });
  return resolvedOptions;
}

function resolveSiteManifestAction(session: ISession, action: SiteAction): SiteAction {
  if (!action.static || !action.url) return { ...action };
  if (!fs.existsSync(action.url))
    throw new Error(`Could not find static resource at "${action.url}". See 'config.site.actions'`);
  const fileHash = hashAndCopyStaticFile(session, action.url, session.publicPath());
  return {
    title: action.title,
    filename: path.basename(action.url),
    url: `/${fileHash}`,
    static: true,
  };
}

/**
 * Build site manifest from local redux state
 *
 * Site manifest acts as the configuration to build the website.
 * It combines local site config and project configs into a single structure.
 */
export async function getSiteManifest(
  session: ISession,
  opts?: { defaultTemplate?: string },
): Promise<SiteManifest> {
  const siteProjects: SiteManifest['projects'] = [];
  const state = session.store.getState() as RootState;
  const siteConfig = selectors.selectCurrentSiteConfig(state);
  if (!siteConfig) throw Error('no site config defined');
  await Promise.all(
    siteConfig.projects?.map(async (siteProj) => {
      if (!siteProj.path) return;
      const proj = await localToManifestProject(session, siteProj.path, siteProj.slug);
      if (!proj) return;
      siteProjects.push(proj);
    }) || [],
  );
  const { nav } = siteConfig;
  const actions = siteConfig.actions?.map((action) => resolveSiteManifestAction(session, action));
  const siteFrontmatter = filterKeys(siteConfig as Record<string, any>, SITE_FRONTMATTER_KEYS);
  const siteTemplateOptions = selectors.selectCurrentSiteTemplateOptions(state) || {};
  const mystTemplate = await getMystTemplate(session, opts);
  const siteConfigFile = selectors.selectCurrentSiteFile(state);
  const validatedOptions = mystTemplate.validateOptions(siteTemplateOptions, siteConfigFile);
  const validatedFrontmatter = mystTemplate.validateDoc(
    siteFrontmatter,
    validatedOptions,
    undefined,
    siteConfigFile,
  );
  const resolvedOptions = await resolveTemplateFileOptions(session, mystTemplate, validatedOptions);
  const manifest: SiteManifest = {
    ...validatedFrontmatter,
    ...resolvedOptions,
    myst: 'v1',
    nav: nav || [],
    actions: actions || [],
    projects: siteProjects,
  };
  return manifest;
}
