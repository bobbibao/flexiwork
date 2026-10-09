import i18nService from "@/core/services/i18n.service.js";

const lang = i18nService.getActiveLanguage();
export const defaultStatuses = [
  { id: 1, value: "active", label: lang === "en" ? "active" : "aktiv", color: "#12B76A" },
  { id: 2, value: "archive", label: lang === "en" ? "archive" : "archiviert", color: "#667085" },
  { id: 3, value: "internal", label: lang === "en" ? "internal" : "intern", color: "##7A5AF8" }
];
