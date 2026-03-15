import { en } from './en';
import { ar } from './ar';

export type TranslationKey = typeof en;
export type Language = 'en' | 'ar';

export const translations: Record<Language, TranslationKey> = {
  en,
  ar,
};

export { en, ar };

