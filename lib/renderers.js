/**
 * Renderer helpers — ported verbatim from TEMPLATE.html.
 * qSz: acronym/question text sizing
 * aSz: answer text sizing
 * tx: transition class map
 */

export function qSz(t) {
  const l = (t || '').length;
  if (l <= 4) return 'clamp(100px,22vw,280px)';
  if (l <= 8) return 'clamp(80px,16vw,220px)';
  if (l <= 14) return 'clamp(60px,12vw,170px)';
  if (l <= 20) return 'clamp(50px,9vw,130px)';
  return 'clamp(36px,6vw,90px)';
}

export function aSz(t) {
  const l = (t || '').length;
  if (l <= 8) return 'clamp(60px,11vw,160px)';
  if (l <= 14) return 'clamp(50px,9vw,130px)';
  if (l <= 20) return 'clamp(42px,7vw,100px)';
  if (l <= 28) return 'clamp(34px,5.5vw,80px)';
  if (l <= 38) return 'clamp(26px,4.2vw,62px)';
  if (l <= 50) return 'clamp(22px,3.3vw,48px)';
  return 'clamp(16px,2.5vw,36px)';
}

export function tx(type) {
  switch (type) {
    case 'source_q': case 'acronym_q': case 'fluency_line': case 'bonus_marker':
      return 't-slam';
    case 'source_a': case 'acronym_a': case 'fluency_source': case 'doa_verdict_dead': case 'doa_verdict_alive':
      return 't-punch';
    case 'round_title': case 'verdict': case 'intermission': case 'last_line': case 'endcard':
      return 't-breath';
    case 'receipt_rain':
      return 't-shake';
    case 'crate_drop':
      return 't-fade';
    default:
      return 't-fade';
  }
}
