import type { OutputOptions } from '@citation-js/core';
import { Cite } from '@citation-js/core';
import sanitizeHtml from 'sanitize-html';

import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';

const DOI_IN_TEXT = /(10.\d{4,9}\/[-._;()/:A-Z0-9]*[A-Z0-9])/i;

// This is duplicated in citation-js types, which are not exported
export type CitationJson = {
  type?: 'article-journal' | string;
  id: string;
  author?: { given: string; family: string }[];
  issued?: { 'date-parts'?: number[][]; literal?: string };
  publisher?: string;
  title?: string;
  'citation-key'?: string;
  'container-title'?: string;
  abstract?: string;
  DOI?: string;
  ISBN?: string;
  ISSN?: string;
  issue?: string;
  keyword?: string;
  page?: string;
  volume?: string;
} & Record<string, any>;

export type InlineNode = {
  type: string;
  value?: string;
  children?: InlineNode[];
};

export function createSanitizer() {
  return {
    cleanCitationHtml(htmlStr: string) {
      return sanitizeHtml(htmlStr, { allowedTags: ['b', 'a', 'u', 'i'] });
    },
  };
}

function cleanRef(citation: string) {
  const sanitizer = createSanitizer();
  const cleanHtml = sanitizer.cleanCitationHtml(citation).trim();
  return cleanHtml.replace(/^1\./g, '').replace(/&amp;/g, '&').trim();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultOpts: OutputOptions = {
  format: 'string',
  type: 'json',
  style: 'ris',
  lang: 'en-US',
};

export enum CitationJSStyles {
  'apa' = 'citation-apa',
  'vancouver' = 'citation-vancouver',
  'harvard' = 'citation-harvard1',
}

export enum InlineCite {
  'p' = 'p',
  't' = 't',
}

const defaultString: OutputOptions = {
  format: 'string',
  lang: 'en-US',
  type: 'html',
  style: CitationJSStyles.apa,
};

export function yearFromCitation(data: CitationJson) {
  let year: number | string | undefined = data.issued?.['date-parts']?.[0]?.[0];
  if (year) return year;
  year = data.issued?.['literal']?.match(/\b[12][0-9]{3}\b/)?.[0];
  if (year) return year;
  return 'n.d.';
}

export function getInlineCitation(data: CitationJson, kind: InlineCite, opts?: InlineOptions) {
  let authors = data.author;
  if (!authors || authors.length === 0) {
    authors = data.editor;
  }
  const year = yearFromCitation(data);
  const prefix = opts?.prefix ? `${opts.prefix} ` : '';
  const suffix = opts?.suffix ? `, ${opts.suffix}` : '';
  let yearPart = kind === InlineCite.t ? ` (${year}${suffix})` : `, ${year}${suffix}`;

  if (opts?.partial === 'author') yearPart = '';
  if (opts?.partial === 'year') {
    const onlyYear = kind === InlineCite.t ? `(${year}${suffix})` : `${year}${suffix}`;
    return [{ type: 'text', value: onlyYear }];
  }

  if (!authors || authors.length === 0) {
    const text = data.publisher || data.title;
    return [{ type: 'text', value: `${prefix}${text}${yearPart}` }];
  }

  if (authors.length === 1) {
    return [{ type: 'text', value: `${prefix}${authors[0].family}${yearPart}` }];
  }
  if (authors.length === 2) {
    return [
      { type: 'text', value: `${prefix}${authors[0].family} & ${authors[1].family}${yearPart}` },
    ];
  }
  if (authors.length > 2) {
    return [
      { type: 'text', value: `${prefix}${authors[0].family} ` },
      { type: 'emphasis', children: [{ type: 'text', value: 'et al.' }] },
      { type: 'text', value: `${yearPart}` },
    ];
  }
  throw new Error('Unknown number of authors for citation');
}

export type InlineOptions = { prefix?: string; suffix?: string; partial?: 'author' | 'year' };

export type CitationRenderer = Record<
  string,
  {
    render: (style?: CitationJSStyles) => string;
    inline: (kind?: InlineCite, opts?: InlineOptions) => InlineNode[];
    getDOI: () => string | undefined;
    getURL: () => string | undefined;
    cite: CitationJson;
  }
>;

function doiUrl(doi?: string) {
  return doi ? `https://doi.org/${doi}` : undefined;
}

function wrapWithAnchorTag(url: string, text?: string) {
  if (!url) return '';
  return `<a target="_blank" rel="noreferrer" href="${url}">${text ?? url}</a>`;
}

function wrapWithDoiAnchorTag(doi?: string) {
  const url = doiUrl(doi);
  if (!url) return '';
  return wrapWithAnchorTag(url, doi);
}

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;

function replaceUrlsWithAnchorElement(str?: string, doi?: string) {
  if (!str) return '';
  const matches = [...str.matchAll(URL_REGEX)];
  let newStr = str;
  matches.forEach((match) => {
    if (doi && match[0].includes(doi)) {
      newStr = newStr.replace(match[0], wrapWithDoiAnchorTag(doi));
    } else {
      newStr = newStr.replace(match[0], wrapWithAnchorTag(match[0]));
    }
  });
  return newStr;
}

export function firstNonDoiUrl(str?: string, doi?: string) {
  if (!str) return;
  const matches = [...str.matchAll(URL_REGEX)];
  return matches.map((match) => match[0]).find((match) => !doi || !match.includes(doi));
}

export async function getCitations(bibtex: string): Promise<CitationRenderer> {
  const cite = new Cite();
  const p = await Cite.async(bibtex);

  return Object.fromEntries(
    p.data.map((c: any): [string, CitationRenderer[0]] => {
      const matchDoi = c.URL?.match(DOI_IN_TEXT) ?? c.note?.match(DOI_IN_TEXT);
      if (!c.DOI && matchDoi) {
        c.DOI = matchDoi[0];
      }
      return [
        c.id,
        {
          inline(kind = InlineCite.p, opts) {
            return getInlineCitation(c, kind, opts);
          },
          render(style?: CitationJSStyles) {
            return replaceUrlsWithAnchorElement(
              cleanRef(cite.set(c).get({ ...defaultString, style: style ?? CitationJSStyles.apa })),
              c.DOI,
            );
          },
          getDOI(): string | undefined {
            return c.DOI || undefined;
          },
          getURL(): string | undefined {
            return firstNonDoiUrl(cleanRef(cite.set(c).get(defaultString)), c.DOI) ?? doiUrl(c.DOI);
          },
          cite: c,
        },
      ];
    }),
  );
}
