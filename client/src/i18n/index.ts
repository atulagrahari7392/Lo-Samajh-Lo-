import { en, TranslationDict } from './en';
import { hi } from './hi';

export type Language = 'en' | 'hi';

export const dictionaries: Record<Language, TranslationDict> = {
  en,
  hi,
};

/**
 * Resolves nested translation keys (e.g. 'common.search' or 'study.exploreCategories')
 * with absolute zero-risk fallback to English and then to the provided fallback or key.
 */
export function getTranslation(
  lang: Language,
  key: string,
  fallback?: string
): string {
  const parts = key.split('.');
  const activeDict = dictionaries[lang] || dictionaries.en;

  // 1. Try active dictionary
  let current: any = activeDict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current === 'string' && current.trim()) {
    return current;
  }

  // 2. Fallback to English dictionary if not already on English
  if (lang !== 'en') {
    let fallbackDict: any = dictionaries.en;
    for (const part of parts) {
      if (fallbackDict && typeof fallbackDict === 'object' && part in fallbackDict) {
        fallbackDict = fallbackDict[part];
      } else {
        fallbackDict = undefined;
        break;
      }
    }
    if (typeof fallbackDict === 'string' && fallbackDict.trim()) {
      return fallbackDict;
    }
  }

  // 3. Fallback to provided fallback string or last segment
  return fallback || parts[parts.length - 1] || key;
}
