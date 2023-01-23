import type { CitationRenderer } from 'citation-js-utils';
import type { Inventory } from 'intersphinx';
import type { Logger } from 'myst-cli-utils';
import type { ReferenceState } from 'myst-transforms';
import type { MinifiedContentCache } from 'nbtx';
import type { Store } from 'redux';

import type { RootState } from '../store';
import type { PreRendererData, RendererData, SingleCitationRenderer } from '../transforms/types';

export type ISession = {
  API_URL: string;
  configFiles: string[];
  store: Store<RootState>;
  log: Logger;
  reload(): ISession;
  clone(): ISession;
  buildPath(): string;
  sitePath(): string;
  contentPath(): string;
  publicPath(): string;
  staticPath(): string;
};

export type ISessionWithCache = ISession & {
  $citationRenderers: Record<string, CitationRenderer>; // keyed on path
  $doiRenderers: Record<string, SingleCitationRenderer>; // keyed on doi
  $internalReferences: Record<string, ReferenceState>; // keyed on path
  $externalReferences: Record<string, Inventory>; // keyed on id
  $mdast: Record<string, { sha256?: string; pre: PreRendererData; post?: RendererData }>; // keyed on path
  $outputs: MinifiedContentCache;
};
