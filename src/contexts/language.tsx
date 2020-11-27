import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback
} from 'react';

import cookies from 'js-cookie';
import {cookieDomain, languageCookieName} from '../configuration';

type Translations = Record<string, Record<string, string>>;

type Localizations = Record<string, string>;

function getLocalizations(languageKey: string, translations: Translations) {
    const localizations: Localizations = {};

    Object.entries(translations).forEach(([key, translation]) => {
        if (translation[languageKey]) {
            localizations[key] = translation[languageKey];
        } else {
            localizations[key] = translation[defaultLanguageKey];

            console.warn(
                new Error(`Missing "${languageKey}" translation: ${key}`)
            );
        }
    });

    return localizations;
}

interface LanguageInterface {
    language?: string;
    translate: (translations: Translations) => Localizations;
    setLanguage?: (language: string) => void;
}

const defaultLanguageKey = 'no';
const LanguageContext = createContext<LanguageInterface>({
    translate: (translations: Translations) =>
        getLocalizations(defaultLanguageKey, translations)
});

const LanguageProvider = (properties: Record<string, unknown>) => {
    const [language, setLanguage] = useState<string | undefined>(() =>
        cookies.get(languageCookieName)
    );

    const translate = useCallback(
        (translations: Translations) =>
            getLocalizations(language ?? defaultLanguageKey, translations),
        [language]
    );

    useEffect(() => {
        if (language) {
            cookies.set(languageCookieName, language, {domain: cookieDomain});
        }
    }, [language]);

    return (
        <LanguageContext.Provider
            {...properties}
            value={{language, translate, setLanguage}}
        />
    );
};

const useLanguage = () => useContext(LanguageContext);

export {LanguageContext, LanguageProvider};
export default useLanguage;
