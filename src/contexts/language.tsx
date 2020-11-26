import React, {createContext, useContext, useState, useEffect} from 'react';
import cookies from 'js-cookie';
import {cookieDomain, languageCookieName} from '../configuration';

interface Language {
    language?: string;
    setLanguage?: (language: string) => void;
}

const LanguageContext = createContext<Language>({});

const LanguageProvider = (properties: Record<string, unknown>) => {
    const [language, setLanguage] = useState<string | undefined>(() =>
        cookies.get(languageCookieName)
    );

    useEffect(() => {
        if (language) {
            cookies.set(languageCookieName, language, {domain: cookieDomain});
        }
    }, [language]);

    return (
        <LanguageContext.Provider
            {...properties}
            value={{language, setLanguage}}
        />
    );
};

const useLanguage = () => useContext(LanguageContext);

export {LanguageContext, LanguageProvider};
export default useLanguage;
