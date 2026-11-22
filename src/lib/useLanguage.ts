import { useState, useCallback, useEffect } from 'react';
import { getStoredLang, storeLang, type LangCode } from '@/lib/i18n';

export function useLanguage() {
  const [lang, setLang] = useState<LangCode>(getStoredLang);

  const changeLanguage = useCallback((code: LangCode) => {
    setLang(code);
    storeLang(code);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return { lang, changeLanguage };
}
