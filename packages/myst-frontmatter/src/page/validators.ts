import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateList,
  validateObjectKeys,
  validateString,
} from 'simple-validators';
import {
  PROJECT_AND_PAGE_FRONTMATTER_KEYS,
  validateProjectAndPageFrontmatterKeys,
} from '../project/validators.js';
import type { PageFrontmatter } from './types.js';
import { FRONTMATTER_ALIASES } from '../index.js';
import { validateKernelSpec } from '../kernelspec/validators.js';
import { validateJupytext } from '../jupytext/validators.js';

export const PAGE_FRONTMATTER_KEYS = [
  ...PROJECT_AND_PAGE_FRONTMATTER_KEYS,
  // These keys only exist on the page
  'kernelspec',
  'jupytext',
  'tags',
];

export const USE_PROJECT_FALLBACK = [
  'authors',
  'date',
  'doi',
  'arxiv',
  'open_access',
  'license',
  'github',
  'binder',
  'source',
  'subject',
  'venue',
  'biblio',
  'numbering',
  'keywords',
  'funding',
  'affiliations',
];

export function validatePageFrontmatterKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: PageFrontmatter = validateProjectAndPageFrontmatterKeys(value, opts);
  if (defined(value.kernelspec)) {
    output.kernelspec = validateKernelSpec(value.kernelspec, incrementOptions('kernelspec', opts));
  }
  if (defined(value.jupytext)) {
    output.jupytext = validateJupytext(value.jupytext, incrementOptions('jupytext', opts));
  }
  if (defined(value.tags)) {
    output.tags = validateList(
      value.tags,
      incrementOptions('tags', opts),
      (file, index: number) => {
        return validateString(file, incrementOptions(`tags.${index}`, opts));
      },
    );
  }
  return output;
}

/**
 * Validate single PageFrontmatter object against the schema
 */
export function validatePageFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(
      input,
      { optional: PAGE_FRONTMATTER_KEYS, alias: FRONTMATTER_ALIASES },
      opts,
    ) || {};
  return validatePageFrontmatterKeys(value, opts);
}
