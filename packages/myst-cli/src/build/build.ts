import path from 'path';
import chalk from 'chalk';
import { ExportFormats } from 'myst-frontmatter';
import { filterPages, loadProjectFromDisk } from '../project';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { collectExportOptions, localArticleExport } from './utils';
import { buildSite } from './site/prepare';
import type { ExportWithInputOutput } from './types';
import { uniqueArray } from '../utils';

export type BuildOpts = {
  site?: boolean;
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  xml?: boolean;
  all?: boolean;
  force?: boolean;
  output?: string;
  checkLinks?: boolean;
};

export function hasAnyExplicitExportFormat(opts: BuildOpts): boolean {
  const { docx, pdf, tex, xml } = opts;
  return docx || pdf || tex || xml || false;
}

export function getExportFormats(opts: BuildOpts & { explicit?: boolean; extension?: string }) {
  const { docx, pdf, tex, xml, all, explicit, extension } = opts;
  const formats = [];
  const any = hasAnyExplicitExportFormat(opts);
  const override = all || (!any && explicit && !extension);
  if (docx || override || extension === '.docx') formats.push(ExportFormats.docx);
  if (pdf || override || extension === '.pdf') formats.push(ExportFormats.pdf);
  if (tex || override || extension === '.tex') formats.push(ExportFormats.tex);
  if (xml || override || extension === '.xml') formats.push(ExportFormats.xml);
  return formats;
}

export function exportSite(session: ISession, opts: BuildOpts) {
  const { docx, pdf, tex, xml, force, site, all } = opts;
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  return site || all || (siteConfig && !force && !docx && !pdf && !tex && !xml && !site);
}

export function getProjectPaths(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  const projectPaths: string[] = [
    selectors.selectCurrentProjectPath(session.store.getState()) ?? path.resolve('.'),
    ...(siteConfig?.projects
      ?.map((proj) => proj.path)
      .filter((projectPath): projectPath is string => !!projectPath) ?? []),
  ];
  return uniqueArray(projectPaths);
}

export async function collectAllBuildExportOptions(
  session: ISession,
  files: string[],
  opts: BuildOpts,
) {
  const { force, output } = opts;
  if (output && files.length !== 1) {
    throw new Error('When specifying a named output for export, you must list exactly one file.');
  }
  const formats = getExportFormats({
    ...opts,
    explicit: files.length > 0,
    extension: output ? path.extname(output) : undefined,
  });
  if (output && formats.length !== 1) {
    throw new Error(`Unrecognized file extension for output: ${path.extname(output)}`);
  }
  session.log.debug(`Exporting formats: "${formats.join('", "')}"`);
  let exportOptionsList: ExportWithInputOutput[];
  if (files.length) {
    exportOptionsList = await collectExportOptions(session, files, formats, {
      // If there is an output and file specified, force is implied
      force: force || !!output || hasAnyExplicitExportFormat(opts),
    });
    if (output) {
      if (exportOptionsList.length !== 1) {
        // This should be caught above
        throw new Error('Expecting only a single export when using output');
      }
      // Override the exports with the command line options
      exportOptionsList[0].output = path.join(path.resolve('.'), output);
    }
  } else {
    const projectPaths = getProjectPaths(session);
    exportOptionsList = (
      await Promise.all(
        projectPaths.map(async (projectPath) => {
          try {
            const project = await loadProjectFromDisk(session, projectPath);
            files = filterPages(project).map((page) => page.file);
          } catch (err) {
            session.log.debug(`Unable to load any content from project at: ${projectPath}\n${err}`);
            return [];
          }
          const exportOptions = await collectExportOptions(session, files, formats, {
            force,
            projectPath,
          });
          return exportOptions;
        }),
      )
    ).flat();
  }
  return exportOptionsList;
}

function extToKind(ext: string): string {
  // We promote `jats` in the docs, even though extension is `.xml`
  if (ext === 'xml') return 'jats';
  return ext;
}

export async function build(session: ISession, files: string[], opts: BuildOpts) {
  const { site, all } = opts;
  const performSiteBuild = all || (files.length === 0 && exportSite(session, opts));
  const exportOptionsList = await collectAllBuildExportOptions(session, files, opts);
  const exportLogList = exportOptionsList.map((exportOptions) => {
    return `${path.relative('.', exportOptions.$file)} -> ${exportOptions.output}`;
  });
  if (exportLogList.length === 0) {
    if (!(site || performSiteBuild)) {
      // Print out the kinds that are filtered
      const kinds = Object.entries(opts)
        .filter(
          ([k, v]) => k !== 'force' && k !== 'output' && k !== 'checkLinks' && k !== 'site' && v,
        )
        .map(([k]) => k);
      session.log.info(
        `📭 No file exports${
          kinds.length > 0 ? ` with kind "${kinds.map(extToKind).join('", "')}"` : ''
        } found.`,
      );
      if (kinds.length) {
        session.log.info(
          chalk.dim(
            `You may need to add an 'exports' field to the frontmatter of the file(s) you wish to export:\n\n---\nexports:\n  - format: ${extToKind(
              kinds[0],
            )}\n---`,
          ),
        );
      } else {
        session.log.info(
          chalk.dim(
            'You may need to specify either:\n  - an export format, e.g. `myst build --pdf`\n  - a file to export, e.g. `myst build my-file.md`',
          ),
        );
      }
    }
  } else {
    session.log.info(`📬 Performing exports:\n   ${exportLogList.join('\n   ')}`);
    await localArticleExport(session, exportOptionsList, {});
  }
  if (!performSiteBuild) return;
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (!siteConfig) {
    session.log.info('🌎 No site configuration found.');
    session.log.debug(`To build a site, first run 'myst init --site'`);
  } else {
    session.log.info(`🌎 Building MyST site`);
    await buildSite(session, opts);
  }
}
