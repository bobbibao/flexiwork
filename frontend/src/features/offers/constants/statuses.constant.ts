import i18nService from "@/core/services/i18n.service.js";

const lang = i18nService.getActiveLanguage();
export const defaultStatuses = [
  { id: 1, value: "active", label: lang === "en" ? "active" : "aktiv", color: "#12B76A" },
  { id: 2, value: "archive", label: lang === "en" ? "archive" : "archiviert", color: "#667085" },
  { id: 3, value: "deleted", label: lang === "en" ? "deleted" : "gelöscht", color: "#F04438" }
];
