import i18nService from "@/core/services/i18n.service.js";

const lang = i18nService.getActiveLanguage();
export const defaultStatusFilterOption = [
  // { label: "Status", value: "", selected: false },
  { label: lang === "en" ? "All" : "Alles", value: "all" },
  { label: lang === "en" ? "Active" : "Aktiv", value: "active", selected: true },
  { label: lang === "en" ? "Archive" : "Archiviert", value: "archive" },
  { label: lang === "en" ? "Deleted" : "Gelöscht", value: "deleted" }
];
