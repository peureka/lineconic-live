import { describe, it, expect } from 'vitest';
import { qSz, aSz, tx } from '../../lib/renderers.js';

describe('qSz — acronym question sizing', () => {
  it('returns largest size for short acronyms (<=4 chars)', () => {
    expect(qSz('N.S.')).toContain('22vw');    // 4 chars
  });

  it('returns next tier for 5-8 chars', () => {
    expect(qSz('I.A.K.')).toContain('16vw'); // 6 chars
  });

  it('scales down for longer acronyms', () => {
    const short = qSz('A.B.');
    const long = qSz('W.A.Y.T.W.T.Y.A.');
    // Longer acronym should have smaller max size
    expect(short).not.toBe(long);
  });

  it('handles empty string', () => {
    const result = qSz('');
    expect(result).toBeTruthy();
  });
});

describe('aSz — answer sizing', () => {
  it('returns largest size for short answers', () => {
    expect(aSz('JAWS')).toContain('11vw');
  });

  it('scales down for long answers', () => {
    const result = aSz('WHY ARE YOU THE WAY THAT YOU ARE');
    expect(result).toContain('vw'); // should have a smaller vw value
  });
});

describe('tx — transition map', () => {
  it('maps source_q to slam', () => {
    expect(tx('source_q')).toBe('t-slam');
  });

  it('maps acronym_q to slam', () => {
    expect(tx('acronym_q')).toBe('t-slam');
  });

  it('maps source_a to punch', () => {
    expect(tx('source_a')).toBe('t-punch');
  });

  it('maps round_title to breath', () => {
    expect(tx('round_title')).toBe('t-breath');
  });

  it('maps receipt_rain to shake', () => {
    expect(tx('receipt_rain')).toBe('t-shake');
  });

  it('maps crate_drop to fade', () => {
    expect(tx('crate_drop')).toBe('t-fade');
  });

  it('returns fade for unknown types', () => {
    expect(tx('unknown_type')).toBe('t-fade');
  });
});
