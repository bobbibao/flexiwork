declare module "@/core/services/i18n.service.js" {
  interface Language {
    lang: string;
    name: string;
    flag: string;
  }

  interface I18nService {
    defaultLanguage: string;
    languages: Language[];
    setActiveLanguage(lang: string): void;
    getActiveLanguage(): string;
  }

  const i18nService: I18nService;
  export default i18nService;
}
