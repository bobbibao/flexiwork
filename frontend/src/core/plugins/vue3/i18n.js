// vue-i18n 11 in legacy mode (keeps this.$t / $t in templates) - docs/ARCHITECTURE.md §17.4.
import { createI18n } from "vue-i18n";
import { locale as en } from "@/core/config/i18n/en";
import { locale as ch } from "@/core/config/i18n/ch";
import { locale as es } from "@/core/config/i18n/es";
import { locale as jp } from "@/core/config/i18n/jp";
import { locale as de } from "@/core/config/i18n/de";
import { locale as fr } from "@/core/config/i18n/fr";

const lang = localStorage.getItem("language") || "de";

const i18n = createI18n({
  legacy: true,
  globalInjection: true,
  locale: lang,
  fallbackLocale: "en",
  messages: { en, ch, es, jp, de, fr },
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  warnHtmlMessage: false
});

export default i18n;
