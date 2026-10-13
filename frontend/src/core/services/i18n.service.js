const i18nService = {
  defaultLanguage: "vi",

  languages: [
    {
      lang: "vi",
      name: "Tiếng Việt",
      flag: process.env.BASE_URL + "media/svg/flags/220-vietnam.svg"
    },
    {
      lang: "de",
      name: "Deutsch",
      flag: process.env.BASE_URL + "media/svg/flags/162-germany.svg"
    },
    {
      lang: "en",
      name: "English",
      flag: process.env.BASE_URL + "media/svg/flags/226-united-states.svg"
    }
  ],

  /**
   * Keep the active language in the localStorage
   * @param lang
   */
  setActiveLanguage(lang) {
    localStorage.setItem("language", lang);
  },

  /**
   * Get the current active language
   * @returns {string | string}
   */
  getActiveLanguage() {
    return localStorage.getItem("language") || this.defaultLanguage;
  }
};

export default i18nService;
