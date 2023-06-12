import type { Root } from 'mdast';
import { computeHash } from 'myst-cli-utils';
import { NotebookCell } from 'myst-common';
import type { GenericNode } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { nanoid } from 'nanoid';
import type { MinifiedOutput } from 'nbtx';
import type { ICell, INotebookContent, IOutput } from '@jupyterlab/nbformat';
import { CELL_TYPES, minifyCellOutput } from 'nbtx';
import { castSession } from '../session/index.js';
import type { ISession } from '../session/types.js';
import { parseMyst } from './myst.js';

function asString(source?: string | string[]): string {
  return (Array.isArray(source) ? source.join('') : source) || '';
}

function createOutputDirective(): { myst: string; id: string } {
  const id = nanoid();
  return { myst: `\`\`\`{output}\n:id: ${id}\n\`\`\``, id };
}

function blockDivider(cell: ICell, index: number) {
  const id =
    cell.metadata.id ?? `nb-cell-${index}-${computeHash(JSON.stringify(cell)).substring(0, 10)}`;
  const type = cell.cell_type === CELL_TYPES.code ? NotebookCell.code : NotebookCell.content;
  return `+++ ${JSON.stringify({ id, type, ...cell.metadata })}\n\n`;
}

export async function processNotebook(
  session: ISession,
  file: string,
  content: string,
  opts?: { minifyMaxCharacters?: number },
): Promise<Root> {
  const { log } = session;
  const { metadata, cells } = JSON.parse(content) as INotebookContent;
  // notebook will be empty, use generateNotebookChildren, generateNotebookOrder here if we want to populate those

  const language = metadata?.kernelspec?.language ?? 'python';
  log.debug(`Processing Notebook: "${file}"`);

  const cache = castSession(session);

  const outputMap: Record<string, MinifiedOutput[]> = {};

  let end = cells.length;
  if (cells && cells.length > 1 && cells?.[cells.length - 1].source.length === 0) {
    end = -1;
  }

  const items = await cells?.slice(0, end).reduce(async (P, cell: ICell, index) => {
    const acc = await P;
    if (cell.cell_type === CELL_TYPES.markdown) {
      const cellContent = asString(cell.source);
      // If the first cell is a frontmatter block, do not put a block break above it
      const omitBlockDivider = index === 0 && cellContent.startsWith('---\n');
      return acc.concat(`${omitBlockDivider ? '' : blockDivider(cell, index)}${cellContent}`);
    }
    if (cell.cell_type === CELL_TYPES.raw) {
      return acc.concat(`${blockDivider(cell, index)}\`\`\`\n${asString(cell.source)}\n\`\`\``);
    }
    if (cell.cell_type === CELL_TYPES.code) {
      const code = `\`\`\`{code-cell} ${language}\n${asString(cell.source)}\n\`\`\``;
      const { myst, id } = createOutputDirective();
      if (cell.outputs && (cell.outputs as IOutput[]).length > 0) {
        const minified: MinifiedOutput[] = await minifyCellOutput(
          cell.outputs as IOutput[],
          cache.$outputs,
          { computeHash, maxCharacters: opts?.minifyMaxCharacters },
        );
        outputMap[id] = minified;
      } else {
        outputMap[id] = [];
      }
      return acc.concat(`${blockDivider(cell, index)}${code}\n\n${myst}`);
    }
    return acc;
  }, Promise.resolve([] as string[]));

  const mdast = parseMyst(session, items.join('\n\n'), file);

  selectAll('output', mdast).forEach((output: GenericNode) => {
    output.data = outputMap[output.id];
  });

  return mdast;
}
