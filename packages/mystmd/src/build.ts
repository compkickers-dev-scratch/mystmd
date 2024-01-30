import { Command } from 'commander';
import { build, Session } from 'myst-cli';
import { clirun } from './clirun.js';
import {
  makeCheckLinksOption,
  makeDocxOption,
  makeForceOption,
  makeJatsOption,
  makePdfOption,
  makeSiteOption,
  makeStrictOption,
  makeTexOption,
  makeAllOption,
  makeNamedExportOption,
  makeHtmlOption,
  makeMecaOptions,
  makeMdOption,
  makeTypstOption,
  makeWatchOption,
  makeCIOption,
} from './options.js';

export function makeBuildCLI(program: Command) {
  const command = new Command('build')
    .description('Build PDF, LaTeX, Word and website exports from MyST files')
    .argument('[files...]', 'list of files to export')
    .addOption(makePdfOption('Build PDF output'))
    .addOption(makeTexOption('Build LaTeX outputs'))
    .addOption(makeTypstOption('Build Typst outputs'))
    .addOption(makeDocxOption('Build Docx output'))
    .addOption(makeMdOption('Build MD output'))
    .addOption(makeJatsOption('Build JATS xml output'))
    .addOption(makeMecaOptions('Build MECA zip output'))
    .addOption(makeSiteOption('Build MyST site content'))
    .addOption(makeHtmlOption('Build static HTML site content'))
    .addOption(makeAllOption('Build all exports'))
    .addOption(makeWatchOption())
    .addOption(makeNamedExportOption('Output file for the export'))
    .addOption(makeForceOption())
    .addOption(makeCheckLinksOption())
    .addOption(makeStrictOption())
    .addOption(makeCIOption())
    .action(clirun(Session, build, program));
  return command;
}
