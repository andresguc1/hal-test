import i18next from 'i18next';
import middleware from 'i18next-http-middleware';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '../locales');

const enTranslations = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const esTranslations = JSON.parse(fs.readFileSync(path.join(localesDir, 'es.json'), 'utf8'));

i18next
    .use(middleware.LanguageDetector)
    .init({
        fallbackLng: 'en',
        preload: ['en', 'es'],
        resources: {
            en: { translation: enTranslations },
            es: { translation: esTranslations }
        },
        detection: {
            order: ['header', 'querystring', 'cookie'],
            caches: false
        }
    });

export default i18next;
export { middleware };
