const NBSP = '\u00a0';
const SHORT = 'в|к|с|у|о|и|а|но|на|по|за|из|от|до|во|со|ко|не|ни|же|ли|бы';
const shortPhrase = new RegExp(`(^|[^\\p{L}\\p{N}])((?:${SHORT})[ \\t]+(?:(?:${SHORT})[ \\t]+)?)([\\p{L}\\p{N}*][\\p{L}\\p{N}*#%-]*)`, 'giu');

/** Pure display-text formatting: run during Vue render, never over the DOM,
 * attributes, search data or user input. Explicit design NBSP/newlines survive.
 * `enabled: false` is an escape hatch for a deliberately composed phrase. */
export function typograph(text, { enabled = true } = {}) {
  if (!enabled || typeof text !== 'string') return text;
  return text
    .replace(shortPhrase, (match, prefix, words, next) => {
      // Avoid turning long model names / words into an unbreakable mobile line.
      if ((words + next).length > 24) return match;
      return prefix + words.replace(/[ \t]+/g, NBSP) + next;
    })
    .replace(/(\d(?:[\d.,]*\d)?)[ \t]+(?=(?:%|₽|ГБ|МБ|КБ|ТБ|SMS|смс|мин(?:ут(?:ы|а)?)?|сек(?:унд(?:ы|а)?)?|месяц(?:а|ев)?|руб(?:\.|лей)?)(?!\p{L}))/giu, `$1${NBSP}`)
    .replace(/(\p{Lu}\.)[ \t]+(?=\p{Lu}(?:\.|[\p{L}-]+))/gu, `$1${NBSP}`);
}
