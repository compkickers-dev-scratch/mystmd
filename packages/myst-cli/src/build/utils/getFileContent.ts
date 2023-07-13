import { resolve } from 'node:path';
import { tic } from 'myst-cli-utils';
import type { LinkTransformer } from 'myst-transforms';
import type { ISession } from '../../session/types.js';
import type { TransformFn } from '../../process/index.js';
import {
  selectPageReferenceStates,
  loadFile,
  selectFile,
  postProcessMdast,
  transformMdast,
  loadProject,
  loadIntersphinx,
  combineProjectCitationRenderers,
} from '../../process/index.js';
import { transformWebp } from '../../transforms/index.js';
import { ImageExtensions } from '../../utils/index.js';

export async function getFileContent(
  session: ISession,
  files: string[],
  imageWriteFolder: string,
  {
    projectPath,
    useExistingImages,
    imageAltOutputFolder,
    imageExtensions,
    extraLinkTransformers,
    simplifyFigures,
  }: {
    projectPath?: string;
    useExistingImages?: boolean;
    imageAltOutputFolder?: string;
    imageExtensions: ImageExtensions[];
    extraLinkTransformers?: LinkTransformer[];
    simplifyFigures: boolean;
  },
) {
  const toc = tic();
  files = files.map((file) => resolve(file));
  projectPath = projectPath ?? resolve('.');
  const { project, pages } = await loadProject(session, projectPath);
  const projectFiles = pages.map((page) => page.file);
  const allFiles = [...new Set([...files, ...projectFiles])];
  await Promise.all([
    // Load all citations (.bib)
    ...project.bibliography.map((path) => loadFile(session, path, '.bib')),
    // Load all content (.md and .ipynb)
    ...allFiles.map((file) => loadFile(session, file, undefined, { minifyMaxCharacters: 0 })),
    // Load up all the intersphinx references
    loadIntersphinx(session, { projectPath }) as Promise<any>,
  ]);
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, projectPath);

  const extraTransforms: TransformFn[] = [];
  if (imageExtensions.includes(ImageExtensions.webp)) {
    extraTransforms.push(transformWebp);
  }
  // if (opts?.extraTransforms) {
  //   extraTransforms.push(...opts.extraTransforms);
  // }
  await Promise.all(
    allFiles.map(async (file) => {
      const pageSlug = pages.find((page) => page.file === file)?.slug;
      await transformMdast(session, {
        file,
        useExistingImages,
        imageWriteFolder,
        imageAltOutputFolder,
        imageExtensions,
        projectPath,
        pageSlug,
        minifyMaxCharacters: 0,
        index: project.index,
        simplifyFigures,
      });
    }),
  );
  const pageReferenceStates = selectPageReferenceStates(
    session,
    allFiles.map((file) => {
      return { file };
    }),
  );
  const selectedFiles = await Promise.all(
    files.map(async (file) => {
      await postProcessMdast(session, {
        file,
        extraLinkTransformers,
        pageReferenceStates,
        simplifyFigures,
        imageExtensions,
      });
      const selectedFile = selectFile(session, file);
      if (!selectedFile) throw new Error(`Could not load file information for ${file}`);
      return selectedFile;
    }),
  );
  session.log.info(
    toc(
      `📚 Built ${allFiles.length} pages for export (including ${
        allFiles.length - files.length
      } dependencies) from ${projectPath} in %s.`,
    ),
  );
  return selectedFiles;
}
