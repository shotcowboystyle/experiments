import { existsSync } from 'node:fs';
import path from 'node:path';

import { withBase } from '~/lib/with-base';

const previews = path.join(process.cwd(), 'public/experiments/previews');

/** Base-relative path of an experiment's captured poster, or undefined if `pnpm previews` hasn't made one. */
export const posterPath = (slug: string): string | undefined =>
  existsSync(path.join(previews, `${slug}.jpg`)) ? withBase(`/experiments/previews/${slug}.jpg`) : undefined;
