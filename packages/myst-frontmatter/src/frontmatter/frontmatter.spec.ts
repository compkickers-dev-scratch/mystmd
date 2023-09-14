import { describe, expect, it, beforeEach } from 'vitest';
import type { ValidationOptions } from 'simple-validators';
import type {
  Affiliation,
  Contributor,
  Biblio,
  Jupytext,
  KernelSpec,
  Numbering,
  PageFrontmatter,
  ProjectFrontmatter,
  SiteFrontmatter,
  Thebe,
} from './types';
import {
  fillPageFrontmatter,
  unnestKernelSpec,
  validateAffiliation,
  validateAndStashObject,
  validateContributor,
  validateBiblio,
  validateExport,
  validateJupytext,
  validateKernelSpec,
  validateNumbering,
  validatePageFrontmatter,
  validateProjectFrontmatter,
  validateSiteFrontmatterKeys,
  validateThebe,
  validateVenue,
} from './validators';

const TEST_CONTRIBUTOR: Contributor = {
  userId: '',
  name: 'Test Author',
  nameParsed: { literal: 'Test Author', given: 'Test', family: 'Author' },
  orcid: '0000-0000-0000-0000',
  corresponding: true,
  email: 'test@example.com',
  roles: ['Software', 'Validation'],
  affiliations: ['example university'],
  twitter: '@test',
  github: 'test',
  url: 'https://example.com',
};

const TEST_AFFILIATION: Affiliation = {
  id: 'abc123',
  address: '123 Example St.',
  city: 'Example town',
  state: 'EX',
  postal_code: '00000',
  country: 'USA',
  name: 'Example University',
  department: 'Example department',
  collaboration: true,
  isni: '0000000000000000',
  ringgold: 99999,
  ror: '0000000000000000',
  url: 'http://example.com',
  email: 'example@example.com',
  phone: '1-800-000-0000',
  fax: '(800) 000-0001',
};

const TEST_BIBLIO: Biblio = {
  volume: 'test',
  issue: 'example',
  first_page: 1,
  last_page: 2,
};

const TEST_THEBE: Thebe = {
  lite: false,
  binder: {
    url: 'https://my.binder.org/blah',
    ref: 'HEAD',
    repo: 'my-org/my-repo',
    provider: 'github',
  },
  server: {
    url: 'https://my.server.org',
    token: 'legit-secret',
  },
  kernelName: 'python3',
  sessionName: 'some-path',
  disableSessionSaving: true,
  mathjaxConfig: 'TeX-AMS_CHTML-full,Safe',
  mathjaxUrl: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js',
  local: {
    url: 'http://localhost:8888',
    token: 'test-secret',
    kernelName: 'python27',
    sessionName: 'another-path',
  },
};

const TEST_NUMBERING: Numbering = {
  enumerator: '',
  figure: true,
  equation: true,
  table: true,
  code: true,
  heading_1: true,
  heading_2: true,
  heading_3: true,
  heading_4: true,
  heading_5: true,
  heading_6: true,
};
const TEST_KERNELSPEC: KernelSpec = {
  name: 'python3',
  language: 'python',
  display_name: 'Python 3',
  argv: ['python3', '-m', 'IPython.kernel', '-f', '{connection_file}'],
  env: {
    a: 1,
    b: 'two',
  },
};
const TEST_JUPYTEXT: Jupytext = {
  formats: 'md:myst',
  text_representation: {
    extension: '.md',
    format_name: 'myst',
    format_version: '0.9',
    jupytext_version: '1.5.2',
  },
};
const TEST_SITE_FRONTMATTER: SiteFrontmatter = {
  title: 'frontmatter',
  description: 'project frontmatter',
  venue: { title: 'test' },
  authors: [
    {
      id: 'jd',
      name: 'John Doe',
      nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
    },
  ],
  github: 'https://github.com/example',
  keywords: ['example', 'test'],
};
const TEST_PROJECT_FRONTMATTER: ProjectFrontmatter = {
  title: 'frontmatter',
  description: 'project frontmatter',
  venue: { title: 'test' },
  authors: [
    {
      id: 'jd',
      name: 'John Doe',
      nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
      affiliations: ['univa'],
    },
  ],
  affiliations: [{ id: 'univa', name: 'University A' }],
  date: '14 Dec 2021',
  name: 'example.md',
  doi: '10.1000/abcd/efg012',
  arxiv: 'https://arxiv.org/example',
  open_access: true,
  license: {},
  github: 'https://github.com/example',
  binder: 'https://example.com/binder',
  source: 'https://example.com/source',
  subject: '',
  biblio: {},
  oxa: '',
  numbering: {},
  math: { a: 'b' },
  keywords: ['example', 'test'],
  exports: [
    {
      format: 'pdf' as any,
      template: 'default',
      output: 'out.tex',
      a: 1,
      article: 'my-file.md',
    },
    {
      format: 'xml' as any,
      article: 'my-file.md',
      sub_articles: ['my-notebook.ipynb'],
    },
  ],
  requirements: ['requirements.txt'],
  resources: ['my-script.sh'],
};

const TEST_PAGE_FRONTMATTER: PageFrontmatter = {
  title: 'frontmatter',
  description: 'page frontmatter',
  venue: { title: 'test' },
  authors: [
    {
      id: 'jd',
      name: 'Jane Doe',
      nameParsed: { literal: 'Jane Doe', given: 'Jane', family: 'Doe' },
      affiliations: ['univb'],
    },
  ],
  affiliations: [{ id: 'univb', name: 'University B' }],
  name: 'example.md',
  doi: '10.1000/abcd/efg012',
  arxiv: 'https://arxiv.org/example',
  open_access: true,
  license: {},
  github: 'https://github.com/example',
  binder: 'https://example.com/binder',
  source: 'https://example.com/source',
  subject: '',
  biblio: {},
  oxa: '',
  numbering: {},
  math: { a: 'b' },
  subtitle: 'sub',
  short_title: 'short',
  date: '14 Dec 2021',
  kernelspec: {},
  jupytext: {},
  keywords: ['example', 'test'],
  exports: [{ format: 'pdf' as any, template: 'default', output: 'out.tex', a: 1 }],
};

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('validateVenue', () => {
  it('empty object returns self', async () => {
    expect(validateVenue({}, opts)).toEqual({});
  });
  it('object with title/url returns self', async () => {
    const venue = {
      title: 'test',
      url: 'http://example.com',
    };
    expect(validateVenue(venue, opts)).toEqual(venue);
  });
  it('string returns object with title', async () => {
    expect(validateVenue('test', opts)).toEqual({ title: 'test' });
  });
  it('invalid keys ignored', async () => {
    expect(validateVenue({ title: 'test', extra: '' }, opts)).toEqual({ title: 'test' });
  });
});

describe('validateContributor', () => {
  it('empty object returns self', async () => {
    expect(validateContributor({}, {}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateContributor({ extra: '' }, {}, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateContributor(TEST_CONTRIBUTOR, {}, opts)).toEqual(TEST_CONTRIBUTOR);
  });
  it('invalid orcid errors', async () => {
    expect(validateContributor({ orcid: 'https://exampale.com/example' }, {}, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid email errors', async () => {
    expect(validateContributor({ email: 'https://example.com' }, {}, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('unknown roles warn', async () => {
    expect(validateContributor({ name: 'my name', roles: ['example'] }, {}, opts)).toEqual({
      name: 'my name',
      nameParsed: { literal: 'my name', given: 'my', family: 'name' },
      roles: ['example'],
    });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
  it('invalid roles errors', async () => {
    expect(validateContributor({ roles: [1] }, {}, opts)).toEqual({ roles: [] });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('corresponding with no email errors', async () => {
    expect(validateContributor({ corresponding: true }, {}, opts)).toEqual({
      corresponding: false,
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('website coerces to url', async () => {
    expect(validateContributor({ website: 'https://example.com' }, {}, opts)).toEqual({
      url: 'https://example.com',
    });
  });
  it('collaborations warns', async () => {
    expect(
      validateContributor(
        {
          collaborations: ['example collaboration'],
        },
        {},
        opts,
      ),
    ).toEqual({});
    expect(opts.messages.warnings?.length).toEqual(1);
  });
});

describe('validateAffiliation', () => {
  it('empty object returns self', async () => {
    expect(validateAffiliation({}, opts)).toEqual({});
    expect(opts.messages.warnings?.length).toBe(1);
  });
  it('extra keys removed', async () => {
    expect(validateAffiliation({ extra: '' }, opts)).toEqual({});
  });
  it('object with name does not warn', async () => {
    expect(validateAffiliation({ name: 'name' }, opts)).toEqual({ name: 'name' });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('full object returns self', async () => {
    expect(validateAffiliation(TEST_AFFILIATION, opts)).toEqual(TEST_AFFILIATION);
  });
  it('invalid ringgold number errors', async () => {
    expect(validateAffiliation({ name: 'name', ringgold: 1 }, opts)).toEqual({ name: 'name' });
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateBiblio', () => {
  it('empty object returns self', async () => {
    expect(validateBiblio({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateBiblio({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateBiblio(TEST_BIBLIO, opts)).toEqual(TEST_BIBLIO);
  });
});

describe('validateThebe', () => {
  it('empty object returns self', async () => {
    expect(validateThebe({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateThebe({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateThebe(TEST_THEBE, opts)).toEqual(TEST_THEBE);
  });
  it('custom provider accepts url as repo value', async () => {
    const output = validateThebe(
      {
        ...TEST_THEBE,
        binder: {
          url: 'https://binder.curvenote.com/services/binder/',
          repo: 'https://curvenote.com/sub/bundle.zip',
          provider: 'custom',
        },
      },
      opts,
    );
    expect(output?.binder).toEqual({
      url: 'https://binder.curvenote.com/services/binder/',
      repo: 'https://curvenote.com/sub/bundle.zip',
      provider: 'custom',
    });
  });
  it('errors if no repo with custom provider', async () => {
    expect(opts.messages).toEqual({});
    expect(
      validateThebe(
        {
          ...TEST_THEBE,
          binder: {
            url: 'https://binder.curvenote.com/services/binder/',
            provider: 'custom',
          },
        },
        opts,
      ),
    ).toEqual({
      ...TEST_THEBE,
      binder: {
        url: 'https://binder.curvenote.com/services/binder/',
        provider: 'custom',
      },
    });
    expect(opts.messages.errors?.length).toEqual(1);
    expect(opts.messages.errors?.[0].property).toEqual('repo');
  });
});

describe('validateNumbering', () => {
  it('empty object returns self', async () => {
    expect(validateNumbering({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateNumbering({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateNumbering(TEST_NUMBERING, opts)).toEqual(TEST_NUMBERING);
  });
});

describe('validateKernelSpec', () => {
  it('empty object returns self', async () => {
    expect(validateKernelSpec({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateKernelSpec({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateKernelSpec(TEST_KERNELSPEC, opts)).toEqual(TEST_KERNELSPEC);
  });
});

describe('validateJupytext', () => {
  it('empty object returns self', async () => {
    expect(validateJupytext({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateJupytext({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateJupytext(TEST_JUPYTEXT, opts)).toEqual(TEST_JUPYTEXT);
  });
});

describe('validateExport', () => {
  it('empty object errors', async () => {
    expect(validateExport({}, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('format only passes', async () => {
    expect(validateExport({ format: 'pdf' }, opts)).toEqual({ format: 'pdf' });
  });
  it('pdf+tex passes', async () => {
    expect(validateExport({ format: 'pdf+tex' }, opts)).toEqual({ format: 'pdf+tex' });
  });
  it('tex+pdf passes', async () => {
    expect(validateExport({ format: 'tex+pdf' }, opts)).toEqual({ format: 'pdf+tex' });
  });
  it('invalid format errors passes', async () => {
    expect(validateExport({ format: 'str' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid template errors', async () => {
    expect(validateExport({ format: 'pdf', template: true }, opts)).toEqual({ format: 'pdf' });
  });
  it('invalid output errors', async () => {
    expect(validateExport({ format: 'pdf', output: true }, opts)).toEqual({ format: 'pdf' });
  });
  it('full object returns self', async () => {
    expect(
      validateExport({ format: 'pdf', template: 'default', output: 'main.tex' }, opts),
    ).toEqual({ format: 'pdf', template: 'default', output: 'main.tex' });
  });
  it('extra keys are maintained', async () => {
    expect(
      validateExport({ format: 'pdf', template: 'default', output: 'main.tex', a: 1 }, opts),
    ).toEqual({ format: 'pdf', template: 'default', output: 'main.tex', a: 1 });
  });
});

describe('validateSiteFrontmatter', () => {
  it('empty object returns self', async () => {
    expect(validateSiteFrontmatterKeys({}, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateSiteFrontmatterKeys(TEST_SITE_FRONTMATTER, opts)).toEqual(TEST_SITE_FRONTMATTER);
  });
  it('full object returns valid object', async () => {
    expect(
      validateSiteFrontmatterKeys(
        { title: 'frontmatter', description: 'site frontmatter', venue: 'test', extra: '' },
        opts,
      ),
    ).toEqual({ title: 'frontmatter', description: 'site frontmatter', venue: { title: 'test' } });
  });
});

describe('validateProjectFrontmatter', () => {
  it('invalid type errors', async () => {
    expect(validateProjectFrontmatter('frontmatter', opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('empty object returns self', async () => {
    expect(validateProjectFrontmatter({}, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateProjectFrontmatter(TEST_PROJECT_FRONTMATTER, opts)).toEqual(
      TEST_PROJECT_FRONTMATTER,
    );
  });
  it('boolean numbering is valid', async () => {
    expect(validateProjectFrontmatter({ numbering: 'false' }, opts)).toEqual({ numbering: false });
    expect(opts.messages.errors?.length).toBeFalsy();
  });
  it('invalid doi errors', async () => {
    expect(validateProjectFrontmatter({ doi: '' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('github username/repo coerces', async () => {
    expect(validateProjectFrontmatter({ github: 'example/repo' }, opts)).toEqual({
      github: 'https://github.com/example/repo',
    });
  });
  it('invalid github errors', async () => {
    expect(validateProjectFrontmatter({ github: 'https://example.com' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid arxiv errors', async () => {
    expect(validateProjectFrontmatter({ arxiv: 'https://example.com' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid math errors', async () => {
    expect(validateProjectFrontmatter({ math: { a: 'valid', b: 0 } }, opts)).toEqual({
      math: { a: 'valid' },
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validatePageFrontmatter', () => {
  it('invalid type errors', async () => {
    expect(validatePageFrontmatter('frontmatter', opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('empty object returns self', async () => {
    expect(validatePageFrontmatter({}, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validatePageFrontmatter(TEST_PAGE_FRONTMATTER, opts)).toEqual(TEST_PAGE_FRONTMATTER);
  });
  it('invalid date errors', async () => {
    expect(validatePageFrontmatter({ date: 'https://example.com' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('valid kernelspec returns self', async () => {
    expect(validatePageFrontmatter({ kernelspec: TEST_KERNELSPEC }, opts)).toEqual({
      kernelspec: TEST_KERNELSPEC,
    });
  });
  it('valid jupyter.kernelspec returns kernelspec', async () => {
    const frontmatter = {
      jupyter: { kernelspec: TEST_KERNELSPEC },
    };
    unnestKernelSpec(frontmatter);
    expect(validatePageFrontmatter(frontmatter, opts)).toEqual({
      kernelspec: TEST_KERNELSPEC,
    });
    expect(opts.messages.warnings).toEqual(undefined);
  });
  it('valid jupyter.kernelspec with extra key warns', async () => {
    const frontmatter = {
      jupyter: { kernelspec: TEST_KERNELSPEC, extra: true },
    };
    unnestKernelSpec(frontmatter);
    expect(validatePageFrontmatter(frontmatter, opts)).toEqual({
      kernelspec: TEST_KERNELSPEC,
    });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
});

describe('fillPageFrontmatter', () => {
  it('empty frontmatters return empty', async () => {
    expect(fillPageFrontmatter({}, {}, opts)).toEqual({});
  });
  it('page frontmatter returns self', async () => {
    expect(fillPageFrontmatter(TEST_PAGE_FRONTMATTER, {}, opts)).toEqual(TEST_PAGE_FRONTMATTER);
  });
  it('project frontmatter returns self without title/description/name/etc', async () => {
    const result = { ...TEST_PROJECT_FRONTMATTER };
    delete result.title;
    delete result.description;
    delete result.name;
    delete result.oxa;
    delete result.exports;
    delete result.requirements;
    delete result.resources;
    expect(fillPageFrontmatter({}, TEST_PROJECT_FRONTMATTER, opts)).toEqual(result);
  });
  it('page and project math are combined', async () => {
    expect(
      fillPageFrontmatter({ math: { a: 'macro a' } }, { math: { b: 'macro b' } }, opts),
    ).toEqual({
      math: { a: 'macro a', b: 'macro b' },
    });
  });
  it('page and project numbering are combined', async () => {
    expect(
      fillPageFrontmatter(
        { numbering: { enumerator: '#', heading_5: true, heading_6: true } },
        { numbering: { enumerator: '$', heading_1: true, heading_6: false } },
        opts,
      ),
    ).toEqual({
      numbering: { enumerator: '#', heading_1: true, heading_5: true, heading_6: true },
    });
  });
  it('extra project affiliations are not included', async () => {
    expect(
      fillPageFrontmatter(
        { authors: [], affiliations: [{ name: 'University A', id: 'univa' }] },
        { authors: [], affiliations: [{ name: 'University B', id: 'univb' }] },
        opts,
      ),
    ).toEqual({
      authors: [],
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('extra page affiliations are not included', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'University A', id: 'univa' }] },
        { authors: [], affiliations: [{ name: 'University B', id: 'univb' }] },
        opts,
      ),
    ).toEqual({
      authors: [],
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('page and project duplicate affiliation ids warn', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'University A', id: 'univa' }] },
        { affiliations: [{ name: 'University B', id: 'univa' }] },
        opts,
      ),
    ).toEqual({
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
  it('placeholder ids replace correctly from page', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'univa', id: 'univa' }] },
        {
          affiliations: [
            { name: 'University A', id: 'univa' },
            { name: 'University B', id: 'univb' },
          ],
        },
        opts,
      ),
    ).toEqual({
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('placeholder ids replace correctly from project', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'University A', id: 'univa' }] },
        {
          affiliations: [
            { name: 'univa', id: 'univa' },
            { name: 'University B', id: 'univb' },
          ],
        },
        opts,
      ),
    ).toEqual({
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('duplicate affiliations do not warn if identical', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'University A', id: 'univa' }] },
        {
          affiliations: [
            { name: 'University A', id: 'univa' },
            { name: 'University B', id: 'univb' },
          ],
        },
        opts,
      ),
    ).toEqual({
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('authors from page take precedent over project', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
            },
          ],
        },
        {
          authors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
            },
          ],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('project authors are used if no page authors', async () => {
    expect(
      fillPageFrontmatter(
        {},
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
            },
          ],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant authors from project are persisted', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
            },
          ],
        },
        {
          authors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
            },
          ],
          funding: [
            {
              awards: [
                {
                  investigators: ['jn'],
                },
              ],
            },
          ],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
        },
      ],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
      funding: [
        {
          awards: [
            {
              investigators: ['jn'],
            },
          ],
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant authors and contributors from project are persisted in place', async () => {
    expect(
      fillPageFrontmatter(
        {},
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
            },
          ],
          contributors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
            },
          ],
          funding: [
            {
              awards: [
                {
                  investigators: ['jn', 'jd'],
                },
              ],
            },
          ],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
        },
      ],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
      funding: [
        {
          awards: [
            {
              investigators: ['jn', 'jd'],
            },
          ],
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant authors from project are persisted when referenced in page', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
              affiliations: ['univa'],
            },
          ],
          affiliations: [{ id: 'univa', name: 'University A' }],
          funding: [
            {
              awards: [
                {
                  investigators: ['jn'],
                },
              ],
            },
          ],
        },
        {
          authors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
              affiliations: ['univb'],
            },
          ],
          affiliations: [{ id: 'univb', name: 'University B' }],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
          affiliations: ['univa'],
        },
      ],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
          affiliations: ['univb'],
        },
      ],
      affiliations: [
        { id: 'univa', name: 'University A' },
        { id: 'univb', name: 'University B' },
      ],
      funding: [
        {
          awards: [
            {
              investigators: ['jn'],
            },
          ],
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant contributors from project are persisted when referenced in page', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
              affiliations: ['univa'],
            },
          ],
          affiliations: [{ id: 'univa', name: 'University A' }],
          funding: [
            {
              awards: [
                {
                  investigators: ['jn'],
                },
              ],
            },
          ],
        },
        {
          contributors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
              affiliations: ['univb'],
            },
          ],
          affiliations: [{ id: 'univb', name: 'University B' }],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
          affiliations: ['univa'],
        },
      ],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
          affiliations: ['univb'],
        },
      ],
      affiliations: [
        { id: 'univa', name: 'University A' },
        { id: 'univb', name: 'University B' },
      ],
      funding: [
        {
          awards: [
            {
              investigators: ['jn'],
            },
          ],
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
});

describe('validateAndStashObject', () => {
  it('string creates object and returns itself', async () => {
    const stash = {};
    const out = validateAndStashObject(
      'Just A. Name',
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('Just A. Name');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'Just A. Name',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('string returns itself when in stash', async () => {
    const stash = {
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    };
    const out = validateAndStashObject(
      'auth1',
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('auth1');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('no id creates hashed id', async () => {
    const stash = {};
    const out = validateAndStashObject(
      { name: 'Just A. Name' },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      { ...opts, file: 'folder/test.file.yml' },
    );
    expect(out).toEqual('contributors-test-file-generated-uid-0');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'contributors-test-file-generated-uid-0',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('no id does not warn on duplicate', async () => {
    const stash = {};
    validateAndStashObject(
      { name: 'Just A. Name' },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      { ...opts, file: 'folder\\my_file' },
    );
    const out = validateAndStashObject(
      { name: 'Just A. Name' },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      { ...opts, file: 'folder\\my_file' },
    );
    expect(out).toEqual('contributors-my_file-generated-uid-0');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'contributors-my_file-generated-uid-0',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('object with id added to stash', async () => {
    const stash = {
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    };
    const out = validateAndStashObject(
      { id: 'auth2', name: 'A. Nother Name' },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('auth2');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
        {
          id: 'auth2',
          name: 'A. Nother Name',
          nameParsed: { literal: 'A. Nother Name', given: 'A. Nother', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('object with id replaces simple object', async () => {
    const stash = {
      contributors: [
        {
          id: 'auth1',
          name: 'auth1',
        },
      ],
    };
    const out = validateAndStashObject(
      {
        id: 'auth1',
        name: 'Just A. Name',
      },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('auth1');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('object with id warns on duplicate', async () => {
    const stash = {
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    };
    const out = validateAndStashObject(
      {
        id: 'auth1',
        name: 'A. Nother Name',
      },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('auth1');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
});
