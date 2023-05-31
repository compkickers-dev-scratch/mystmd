import type { Author, PageFrontmatter } from 'myst-frontmatter';
import type { RendererAuthor, RendererDoc, ValueAndIndex } from './types';

const ALPHA = 'ABCDEFGHIJKLMNOPQURSUVWXYZ';

function indexAndLetter(index: number) {
  const value = ALPHA[index % ALPHA.length];
  const multiplier = Math.ceil((index + 1) / ALPHA.length);
  return { index: index + 1, letter: value.repeat(multiplier) };
}
function undefinedIfEmpty<T>(array?: T[]): T[] | undefined {
  // Explicitly return undefined
  if (!array || array.length === 0) return undefined;
  return array;
}

function addIndicesToAuthors(
  authors: Author[],
  affiliationList: RendererDoc['affiliations'],
  collaborationList: RendererDoc['collaborations'],
): RendererAuthor[] {
  const affiliationLookup: Record<string, ValueAndIndex> = {};
  affiliationList.forEach((affil) => {
    affiliationLookup[affil.value] = affil;
  });
  const collaborationLookup: Record<string, ValueAndIndex> = {};
  collaborationList.forEach((col) => {
    collaborationLookup[col.value] = col;
  });
  let correspondingIndex = 0;
  return authors.map((auth, index) => {
    let corresponding: ValueAndIndex | undefined;
    if (auth.corresponding) {
      corresponding = {
        value: auth.corresponding,
        ...indexAndLetter(correspondingIndex),
      };
      correspondingIndex += 1;
    }
    let affiliations = auth.affiliations?.map((value) => {
      return { ...affiliationLookup[value] };
    });
    if (!affiliations || affiliations.length === 0) {
      // Affiliations are explicitly undefined if length === 0
      affiliations = undefined;
    }
    let collaborations = auth.collaborations?.map((value) => {
      return { ...collaborationLookup[value] };
    });
    if (!collaborations || collaborations.length === 0) {
      // Affiliations are explicitly undefined if length === 0
      collaborations = undefined;
    }
    const [givenName, ...surnameParts] = auth.name?.split(' ') || ['', ''];
    const surname = surnameParts.join(' ');
    return {
      ...auth,
      ...indexAndLetter(index),
      corresponding,
      affiliations,
      collaborations,
      given_name: givenName,
      surname,
    };
  });
}

function affiliationsFromAuthors(authors: Author[]): ValueAndIndex[] {
  const allAffiliations = authors.map((auth) => auth.affiliations || []).flat();
  return [...new Set(allAffiliations)].map((value, index) => {
    return { value, ...indexAndLetter(index) };
  });
}

function collaborationsFromAuthors(authors: Author[]): ValueAndIndex[] {
  const allCollaborations = authors.map((auth) => auth.collaborations || []).flat();
  return [...new Set(allCollaborations)].map((value, index) => {
    return { value, ...indexAndLetter(index) };
  });
}

export function extendFrontmatter(frontmatter: PageFrontmatter): RendererDoc {
  const datetime = frontmatter.date ? new Date(frontmatter.date) : new Date();
  const affiliations = affiliationsFromAuthors(frontmatter.authors || []);
  const collaborations = collaborationsFromAuthors(frontmatter.authors || []);
  const doc: RendererDoc = {
    ...frontmatter,
    date: {
      day: String(datetime.getDate()),
      month: String(datetime.getMonth() + 1),
      year: String(datetime.getFullYear()),
    },
    authors: addIndicesToAuthors(frontmatter.authors || [], affiliations, collaborations),
    affiliations,
    collaborations,
    bibliography: undefinedIfEmpty(frontmatter.bibliography),
  };
  return doc;
}
