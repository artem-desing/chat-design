import { InlineCodeSnippet } from '@wallarm-org/design-system/CodeSnippet';
import type { ChainDetail } from './types';

/**
 * Expanded detail renderer (spec §8). Freeform by `detail.kind`:
 *  - findings → a bulleted list, each item a sentence of WADS inline-code chips:
 *      `{code}` on `{on}` : {note}   (matches the Figma drawer composition)
 *  - text     → a reasoning paragraph
 *  - node     → caller-supplied React node
 *
 * The chips are the real WADS `InlineCodeSnippet` (copy disabled — purely
 * presentational here), not a hand-rolled <code> element.
 */
export function Detail({ detail }: { detail: ChainDetail }) {
  if (detail.kind === 'findings') {
    return (
      <ul className="cot-findings">
        {detail.items.map((f, i) => (
          <li className="cot-finding" key={`${f.code}-${i}`}>
            <InlineCodeSnippet code={f.code} size="sm" copyable={false} />
            {f.on ? (
              <>
                {' '}
                on <InlineCodeSnippet code={f.on} size="sm" copyable={false} />
              </>
            ) : null}
            {f.note ? <> : {f.note}</> : null}
          </li>
        ))}
      </ul>
    );
  }

  if (detail.kind === 'text') {
    return <p className="cot-detail">{detail.text}</p>;
  }

  return <div className="cot-detail">{detail.node}</div>;
}
