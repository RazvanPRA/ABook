import 'i18next';
import type ro from './ro.json';

// Typed translation keys: t('tabs.library') is checked at compile time.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof ro };
  }
}
