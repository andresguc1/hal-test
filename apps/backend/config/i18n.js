import i18next from 'i18next';
import middleware from 'i18next-http-middleware';
import fs from 'fs';
import path from 'path';
import paths from './paths.js';

const localesDir = path.join(paths.BACKEND_ROOT, 'locales');

const enTranslations = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const esTranslations = JSON.parse(fs.readFileSync(path.join(localesDir, 'es.json'), 'utf8'));
const frTranslations = JSON.parse(fs.readFileSync(path.join(localesDir, 'fr.json'), 'utf8'));
const ptTranslations = JSON.parse(fs.readFileSync(path.join(localesDir, 'pt.json'), 'utf8'));

i18next.use(middleware.LanguageDetector).init({
    fallbackLng: 'en',
    preload: ['en', 'es', 'fr', 'pt'],
    supportedLngs: ['en', 'es', 'fr', 'pt'],
    nonExplicitSupportedLngs: false,
    resources: {
        en: { translation: enTranslations },
        es: { translation: esTranslations },
        fr: { translation: frTranslations },
        pt: { translation: ptTranslations },
    },
    detection: {
        order: ['header', 'querystring', 'cookie'],
        caches: false,
    },
});

export default i18next;
export { middleware };
