import path from 'node:path';
import chokidar from 'chokidar';
import { ExportFormats } from 'myst-frontmatter';
import { findCurrentProjectAndLoad } from '../../config.js';
import { loadProjectFromDisk } from '../../project/index.js';
import type { ISession } from '../../session/index.js';
import type {
  ExportFn,
  ExportOptions,
  ExportResults,
  ExportWithInputOutput,
  ExportWithOutput,
} from '../types.js';
import { resolveAndLogErrors } from './resolveAndLogErrors.js';
import { runTexZipExport, runTexExport } from '../tex/single.js';
import { runTypstExport, runTypstZipExport } from '../typst.js';
import { runWordExport } from '../docx/single.js';
import { runJatsExport } from '../jats/single.js';
import { texExportOptionsFromPdf } from '../pdf/single.js';
import { createPdfGivenTexExport } from '../pdf/create.js';
import { runMecaExport } from '../meca/index.js';
import { runMdExport } from '../md/index.js';
import { selectors, watch as watchReducer } from '../../store/index.js';

async function runExportAndWatch(
  watch: boolean,
  exportFn: ExportFn,
  session: ISession,
  $file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
): Promise<ExportResults> {
  let results = await exportFn(session, $file, exportOptions, projectPath, clean);
  if (watch) {
    const watchedFiles = new Set([
      $file,
      ...exportOptions.articles,
      ...exportOptions.articles
        .map((article) => {
          return selectors.selectFileDependencies(session.store.getState(), article);
        })
        .flat(),
    ]);
    chokidar
      .watch([...watchedFiles], {
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      })
      .on('change', async (eventType, modifiedFile) => {
        const { reloading } = selectors.selectReloadingState(session.store.getState());
        if (reloading) {
          session.store.dispatch(watchReducer.actions.markReloadRequested(true));
          return;
        }
        session.store.dispatch(watchReducer.actions.markReloading(true));
        session.log.debug(`File modified: "${modifiedFile}" (${eventType})`);
        while (selectors.selectReloadingState(session.store.getState()).reloadRequested) {
          // If reload(s) were requested during previous build, just reload everything once.
          session.store.dispatch(watchReducer.actions.markReloadRequested(false));
          results = await exportFn(session, $file, exportOptions, projectPath, clean);
        }
        session.store.dispatch(watchReducer.actions.markReloading(false));
        results = await exportFn(session, $file, exportOptions, projectPath, clean);
      });
  }
  return results;
}

type Options = Pick<
  ExportOptions,
  'clean' | 'projectPath' | 'throwOnFailure' | 'glossaries' | 'watch'
>;

async function _localArticleExport(
  session: ISession,
  exportOptionsList: ExportWithInputOutput[],
  opts: Options,
) {
  const { clean, projectPath, watch } = opts;
  const errors = await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptionsWithFile) => {
      const { $file, $project, ...exportOptions } = exportOptionsWithFile;
      const { format, output } = exportOptions;
      const sessionClone = session.clone();
      const fileProjectPath =
        projectPath ?? $project ?? findCurrentProjectAndLoad(sessionClone, path.dirname($file));

      if (fileProjectPath) {
        await loadProjectFromDisk(sessionClone, fileProjectPath);
      }
      let exportFn: ExportFn;
      if (format === ExportFormats.tex) {
        if (path.extname(output) === '.zip') {
          exportFn = runTexZipExport;
        } else {
          exportFn = runTexExport;
        }
      } else if (format === ExportFormats.typst) {
        if (path.extname(output) === '.zip') {
          exportFn = runTypstZipExport;
        } else {
          exportFn = runTypstExport;
        }
      } else if (format === ExportFormats.docx) {
        exportFn = runWordExport;
      } else if (format === ExportFormats.xml) {
        exportFn = runJatsExport;
      } else if (format === ExportFormats.md) {
        exportFn = runMdExport;
      } else if (format === ExportFormats.meca) {
        exportFn = runMecaExport;
      } else {
        const keepTexAndLogs = format === ExportFormats.pdftex;
        exportFn = async (fnSession, fnFile, fnOpts, fnPath, fnClean) => {
          const texExportOptions = texExportOptionsFromPdf(
            fnSession,
            fnOpts,
            keepTexAndLogs,
            fnClean,
          );
          const results = await runTexExport(fnSession, fnFile, texExportOptions, fnPath, fnClean);
          await createPdfGivenTexExport(
            fnSession,
            texExportOptions,
            output,
            keepTexAndLogs,
            fnClean,
            results.hasGlossaries,
          );
          return results;
        };
      }
      await runExportAndWatch(
        !!watch,
        exportFn,
        sessionClone,
        $file,
        exportOptions,
        fileProjectPath,
        clean,
      );
    }),
    opts.throwOnFailure,
  );
  return errors;
}

export async function localArticleExport(
  session: ISession,
  exportOptionsList: ExportWithInputOutput[],
  opts: Options,
) {
  // We must perform other exports before MECA, since MECA includes the others
  const errors = await _localArticleExport(
    session,
    exportOptionsList.filter((expOpts) => expOpts.format !== ExportFormats.meca),
    { ...opts, throwOnFailure: false },
  );
  await _localArticleExport(
    session,
    exportOptionsList.filter((expOpts) => expOpts.format === ExportFormats.meca),
    opts,
  );
  if (opts.throwOnFailure && errors.length) throw errors[0];
}
