import { Command, Option } from 'commander';
import { clean } from '../build';
import { Session } from '../session';
import { clirun } from './clirun';
import {
  makeAllOption,
  makeDocxOption,
  makeHtmlOption,
  makeJatsOption,
  makePdfOption,
  makeSiteOption,
  makeTexOption,
  makeYesOption,
} from './options';

export function makeTempOption() {
  return new Option(
    '--temp',
    'Delete the _build/temp folder where intermediate build artifacts are saved',
  ).default(false);
}

export function makeExportsOption() {
  return new Option(
    '--exports',
    'Delete the _build/exports folder where exports are saved by default',
  ).default(false);
}

export function makeTemplatesOption() {
  return new Option(
    '--templates',
    'Delete the _build/templates folder where downloaded templates are saved',
  ).default(false);
}

export function makeCleanCLI(program: Command) {
  const command = new Command('clean')
    .description('Remove exports, temp files and installed templates')
    .argument('[files...]', 'list of files to clean corresponding outputs')
    .addOption(makePdfOption('Clean PDF output'))
    .addOption(makeTexOption('Clean LaTeX outputs'))
    .addOption(makeDocxOption('Clean Docx output'))
    .addOption(makeJatsOption('Build JATS xml output'))
    .addOption(makeSiteOption('Clean MyST site content'))
    .addOption(makeHtmlOption('Clean static HTML site content'))
    .addOption(makeTempOption())
    .addOption(makeExportsOption())
    .addOption(makeTemplatesOption())
    .addOption(
      makeAllOption('Delete all exports, site content, templates, and temp files created by MyST'),
    )
    .addOption(makeYesOption())
    .action(clirun(Session, clean, program));
  return command;
}
