import { ReportExportCode } from "./constants";
import { formatDate } from "./dateUtils";

export function countWordsInText(inputString: string): number {
  const trimmedString = inputString.trim();

  // If the trimmed text is empty, return 0
  if (trimmedString === "") {
    return 0;
  }

  const words = trimmedString.split(/\s+/); // Using regex to handle multiple spaces
  return words.length;
}

export function truncateByWords(inputString: string, wordLimit: number, ellipsis: string = "..."): string {
  const wordsArray = inputString.split(" ");
  if (wordsArray.length <= wordLimit) {
    return inputString;
  }

  const truncatedString = wordsArray.slice(0, wordLimit).join(" ");

  return truncatedString + ellipsis;
}

export function truncateByLength(str: string, maxLength: number, ellipsis: string = "..."): string {
  if (str.length <= maxLength) {
    return str;
  }

  const truncatedString = str.substring(0, maxLength);

  return truncatedString + ellipsis;
}

export function randString(length: number): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function generateExportFileName(type: string, options: Record<string, any> = {}): string {
  // Default file name
  let fileName: string = "exported_report_file";

  switch (type) {
    case ReportExportCode.REPORT_ADDRESS:
      fileName = `Addresse_${formatDate(new Date(), "YYYY-MM-DD")}`;
      break;
    case ReportExportCode.REPORT_OFFER:
      fileName = `Angebote_${formatDate(new Date(), "YYYY-MM-DD")}`;
      break;
    case ReportExportCode.REPORT_PROJECT:
      fileName = `Auftragsliste_${formatDate(new Date(), "YYYY-MM-DD")}`;
      break;
    case ReportExportCode.REPORT_PROJECT_PHASES: {
      // {prj_number} {prj_title} - Aufwand nach Teilleistungen - {start_date} - {end_date}.*
      const { start_date, end_date, project } = options;
      fileName = `${project.number} ${project.name} - Aufwand nach Teilleistungen - ${formatDate(
        start_date,
        "YYYY-MM-DD"
      )} - ${formatDate(end_date, "YYYY-MM-DD")}`;
      break;
    }
    case ReportExportCode.REPORT_PROJECT_TASKS: {
      // {prj_number} {prj_title}_{start_date} - {end_date}.*
      const { start_date, end_date, project } = options;
      fileName = `${project.number} ${project.name}_${formatDate(start_date, "YYYY-MM-DD")} - ${formatDate(
        end_date,
        "YYYY-MM-DD"
      )}`;
      break;
    }
    case ReportExportCode.REPORT_EFFORTS_INTERNAL:
    case ReportExportCode.REPORT_EFFORTS_INTERNAL_WITHOUT_RATE: {
      // {prj_number} {prj_title} - Intern - {start_date} - {end_date}.*
      const { start_date, end_date, project } = options;
      fileName = `${project.number} ${project.name} - Intern - ${formatDate(start_date, "YYYY-MM-DD")} - ${formatDate(
        end_date,
        "YYYY-MM-DD"
      )}`;
      break;
    }
    case ReportExportCode.REPORT_EFFORTS_EXTERNAL:
    case ReportExportCode.REPORT_EFFORTS_EXTERNAL_WITHOUT_RATE: {
      // {prj_number} {prj_title} - Extern - {start_date} - {end_date}.*
      const { start_date, end_date, project } = options;
      fileName = `${project.number} ${project.name} - Extern - ${formatDate(start_date, "YYYY-MM-DD")} - ${formatDate(
        end_date,
        "YYYY-MM-DD"
      )}`;
      break;
    }
    case ReportExportCode.REPORT_PROJECT_ALL_INVOICES: {
      // {prj_number} {prj_title} - Projektübersicht - {export_date}.*
      const { project } = options;
      fileName = `${project.number} ${project.name} - Projektübersicht - ${formatDate(new Date(), "YYYY-MM-DD")}`;
      break;
    }
    case ReportExportCode.REPORT_INVOICES:
      fileName = `Rechnungen_${formatDate(new Date(), "YYYY-MM-DD")}`;
      break;
    case ReportExportCode.REPORT_EMPLOYEE:
      // Mitarbeiterliste-{export_date}.*
      fileName = `Mitarbeiterliste_${formatDate(new Date(), "YYYY-MM-DD")}`;
      break;
    case ReportExportCode.REPORT_EMPLOYEE_WITH_RATE:
      // Mitarbeiterliste mit hk und tarifen-{export_date}.*
      fileName = `Mitarbeiterliste mit hk und tarifen_${formatDate(new Date(), "YYYY-MM-DD")}`;
      break;
    case ReportExportCode.REPORT_EMPLOYEE_FLEX_AND_HOLIDAYS: {
      // Aufwand nach Mitarbeitern und Aufträgen - {user.name} - {start_date} - {end_date}.*
      const { start_date, end_date, user } = options;
      let userName = user.name;
      if (!userName) {
        userName = user.first_name + " " + user.last_name;
      }
      fileName = `Aufwand nach Mitarbeitern und Aufträgen - ${userName} - ${formatDate(
        start_date,
        "YYYY-MM-DD"
      )} - ${formatDate(end_date, "YYYY-MM-DD")}`;
      break;
    }
    case ReportExportCode.REPORT_EMPLOYEE_EFFORT: {
      // Gleitzeit und feriensaldo - {user.name} - {start_date} - {end_date}.*
      const { start_date, end_date, user } = options;
      let userName = user.name;
      if (!userName) {
        userName = user.first_name + " " + user.last_name;
      }
      fileName = `Gleitzeit und feriensaldo - ${userName} - ${formatDate(start_date, "YYYY-MM-DD")} - ${formatDate(
        end_date,
        "YYYY-MM-DD"
      )}`;
      break;
    }
  }

  // Return the file name with the extension
  return fileName + ".pdf";
}
