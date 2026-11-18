import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ro from './ro.json';

export const DEFAULT_LANGUAGE = 'ro';
export const resources = { ro: { translation: ro } } as const;

/** Single i18next instance for the app. Synchronous init: resources are bundled, nothing is fetched. */
export const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  resources,
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});
