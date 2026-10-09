import { ProjectDetailDto } from 'src/modules/projects/dto';
import { formatDate } from '../utils';
import * as ExcelJS from "exceljs";
import Company from 'src/database/models/companies.model';
import Setting from 'src/database/models/setting.model';

interface XLSXCell {
  index: string;
  heading: ExcelJS.CellValue;
  style?: Partial<ExcelJS.Font>,
  alignment?: Partial<ExcelJS.Alignment>;
}

const DEFAULT_HEADER_CELL_STYLE: Partial<ExcelJS.Font> = { 
  name: 'Calibri', 
  bold: true, 
  underline: true
};
const DEFAULT_HEADER_CELL_ALIGNMENT: Partial<ExcelJS.Alignment> = { horizontal: 'left' };

export const invoiceXLSXHeader: XLSXCell[] = [
  { 
    index: 'A1', 
    heading: `Export "Rechnungen" von ${formatDate(new Date(), 'MM.DD.YY HH:mm:ss UTC', true)}`,
    style: { name: 'Calibri', bold: true },
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT, 
  },
  { 
    index: 'A3', 
    heading: 'Rechnungsdatum',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'B3', 
    heading: 'Rechnung fällig am',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'C3', 
    heading: 'Mahnung 1 Datum',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'D3', 
    heading: 'Mahnung 1 fällig am',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'E3', 
    heading: 'Mahnung 2 Datum',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'F3', 
    heading: 'Mahnung 2 fällig am',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'G3', 
    heading: 'Rechnung abgeschlossen',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'H3', 
    heading: 'Rechnungs Nummer',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'I3', 
    heading: 'Titel',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'J3', 
    heading: 'Einzahlungsschein Ref.-Nr.',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'K3', 
    heading: 'Kunde',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'L3', 
    heading: 'Status',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'M3', 
    heading: 'Bemerkung',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'N3', 
    heading: 'Betrag Netto',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'O3', 
    heading: 'Betrag Brutto',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
];

export const offerXLSXHeader: XLSXCell[] = [
  { 
    index: 'A1',
    heading: 'Liste der Angebote',
    style: { name: 'Calibri', bold: true },
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'A3', 
    heading: 'Auftrag Nr.',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'B3', 
    heading: 'Kunde',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'C3', 
    heading: 'Bezeichnung',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'D3', 
    heading: 'Sum',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'E3', 
    heading: 'Datum',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
];

export const projectXLSXHeader: XLSXCell[] = [
  { 
    index: 'A1',
    heading: 'Liste der Projekte',
    style: { name: 'Calibri', bold: true },
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'A3', 
    heading: 'Auftrag Nr.',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'B3', 
    heading: 'Kunde',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'C3', 
    heading: 'Bezeichnung',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'D3', 
    heading: 'Verrechnet',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'E3', 
    heading: 'Offen',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'F3', 
    heading: 'Stunden Total',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'G3', 
    heading: 'Stunden geschrieben',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'H3', 
    heading: 'Beginn',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'I3', 
    heading: 'Ende',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
];

export const userWithRateXLSXHeader: XLSXCell[] = [
  { 
    index: 'A1',
    heading: `Export "Rechnungen" von ${formatDate(new Date(), 'MM.DD.YY HH:mm:ss UTC', true)}`,
    style: { name: 'Calibri', bold: true },
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'A3', 
    heading: 'Name',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'B3', 
    heading: 'Jahrg',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'C3', 
    heading: 'Funktion',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'D3', 
    heading: 'Tarif',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
];

export const userXLSXHeader: XLSXCell[] = [
  {
    index: 'A1',
    heading: `Export "Rechnungen" von ${formatDate(new Date(), 'MM.DD.YY HH:mm:ss UTC', true)}`,
    style: { name: 'Calibri', bold: true },
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'A3', 
    heading: 'Name',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT  
  },
  { 
    index: 'B3', 
    heading: 'Addresse Email/Tel.Nr..',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT  
  },
  { 
    index: 'C3', 
    heading: 'Beruf Geb.Dat.',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT  
  },
  { 
    index: 'D3', 
    heading: 'Stellenantritt',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT  
  },
];

export const addressesXLSXHeader: XLSXCell[] = [
  {  
    index: 'A1',
    heading: `Export "Rechnungen" von ${formatDate(new Date(), 'MM.DD.YY HH:mm:ss UTC', true)}`,
    style: { name: 'Calibri', bold: true },
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'A3', 
    heading: 'Firma/Name',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'B3', 
    heading: 'Kategorie',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'C3', 
    heading: 'Adresse',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'D3', 
    heading: 'Postleitzahl',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'E3', 
    heading: 'Ort',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'F3', 
    heading: 'Email',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
  { 
    index: 'G3', 
    heading: 'Tel',
    style: DEFAULT_HEADER_CELL_STYLE,
    alignment: DEFAULT_HEADER_CELL_ALIGNMENT
  },
];

export const expenseNoRateXLSXHeader = (startDate: Date, endDate: Date): XLSXCell[] => {
  return [
    {
      index: 'A1',
      heading: 'Aufwand intern nach Aufträgen, Teilleistungen und Honorarkategorien',
      style: { name: 'Calibri', bold: true },
      alignment: DEFAULT_HEADER_CELL_ALIGNMENT
    },
    { 
      index: 'A3', 
      heading: 'Datum:',
      style: { name: 'Calibri' }
    },
    { 
      index: 'B3', 
      heading: formatDate(new Date(), 'DD.MM.YYYY'),
      style: { name: 'Calibri' }
    },
    { 
      index: 'A4', 
      heading: 'Daten von:',
      style: { name: 'Calibri' } 
    },
    { 
      index: 'B4', 
      heading: `${formatDate(startDate, 'DD.MM.YYYY')} - ${formatDate(endDate, 'DD.MM.YYYY')}`,
      style: { name: 'Calibri' }
    },
    { 
      index: 'A6', 
      heading: 'Auftrag Nr.',
      style: { name: 'Calibri', bold: true, underline: true }
    },
    { 
      index: 'B6', 
      heading: 'Bezeichnung',
      style: { name: 'Calibri', bold: true, underline: true } 
    },
    { 
      index: 'G6', 
      heading: 'Aufwand (Stunden)',
      style: { name: 'Calibri', bold: true, underline: true } 
    },
  ];
};

export const expenseXLSXHeader = (startDate: Date, endDate: Date): XLSXCell[] => {
  return [
    {
      index: 'A1',
      heading: 'Aufwand intern nach Aufträgen, Teilleistungen und Honorarkategorien',
      style: { name: 'Calibri', bold: true },
      alignment: DEFAULT_HEADER_CELL_ALIGNMENT
    },
    { 
      index: 'A3', 
      heading: 'Datum:',
      style: { name: 'Calibri' }
    },
    { 
      index: 'B3', 
      heading: formatDate(new Date(), 'DD.MM.YYYY'),
      style: { name: 'Calibri' }
    },
    { 
      index: 'A4', 
      heading: 'Daten von:',
      style: { name: 'Calibri' } 
    },
    { 
      index: 'B4', 
      heading: `${formatDate(startDate, 'DD.MM.YYYY')} - ${formatDate(endDate, 'DD.MM.YYYY')}`,
      style: { name: 'Calibri' }
    },
    { 
      index: 'A6', 
      heading: 'Auftrag Nr.', 
      style: { name: 'Calibri', bold: true, underline: true }
    },
    { 
      index: 'B6', 
      heading: 'Bezeichnung',
      style: { name: 'Calibri', bold: true, underline: true }
    },
    { 
      index: 'F6', 
      heading: 'Tarif', 
      style: { name: 'Calibri', bold: true, underline: true }
    },
    { 
      index: 'G6', 
      heading: 'Aufwand (Stunden)', 
      style: { name: 'Calibri', bold: true, underline: true }
    },
    { 
      index: 'H6', 
      heading: 'Aufwand (Betrag)',
      style: { name: 'Calibri', bold: true, underline: true }
    },
  ];
};

export const mainProjectXLSXFixedHeader = (
  company: Company,
  setting: Setting,
  mainProject: Partial<ProjectDetailDto>
): XLSXCell[] => {
  const detailCost = mainProject.detail_cost;
  const companyName = mainProject.company ? mainProject.company.name : "";
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const companyAddress: string = setting.master_data["address"] ?? "";

  const a4Heading = 'Auftrag Nr.: ' + (mainProject.number && mainProject.number.custom_id 
    ? mainProject.number.custom_id 
    : mainProject.number?.id);
  const c12Heading = detailCost.total_net + detailCost.total_netnk;
  const d12Heading = detailCost.total_gross + detailCost.total_grossnk;

  return [
    { 
      index: 'A1', 
      heading: 'Projektübersicht Rechnungen', 
      style: { name: "Calibri", size: 14, bold: true } 
    },
    { 
      index: 'A3', 
      heading: `Druckdatum: ${formatDate(new Date(), 'MM.DD.YY HH:mm:ss UTC', true)}`,
      style: { name: "Calibri", size: 8 }
    },
    {
      index: 'A4',
      heading: a4Heading,
      style: { name: "Calibri", size: 8 }
    },
    {
      index: 'A5',
      heading: `Auftrag: ${mainProject.name}`,
      style: { name: "Calibri", size: 8 }
    },
    {
      index: 'A7',
      heading: `Projektstand ${companyName}`,
      style: { name: "Calibri", size: 14, bold: true }
    },
    {
      index: 'A11',
      heading: 'Offener Honorarbetrag',
      style: { name: "Calibri", size: 11, bold: true }
    },
    {
      index: 'C11',
      heading: '(exkl. MWST)',
      style: { name: "Calibri" },
      alignment: { horizontal: 'right' }
    },
    {
      index: 'D11',
      heading: '(inkl. MWST)',
      style: { name: "Calibri" },
      alignment: { horizontal: 'right' }
    },
    {
      index: 'A12',
      heading: 'Honorarangebot (inkl. NT)',
      style: { name: "Calibri" }
    },
    {
      index: 'C12',
      heading: c12Heading,
      style: { name: "Calibri" }
    },
    {
      index: 'D12',
      heading: d12Heading,
      style: { name: "Calibri" }
    },
    {
      index: 'A13',
      heading: `Rechnungen ${companyName}`,
      style: { name: "Calibri" }
    },
    {
      index: 'A14',
      heading: 'Total offener Honorarbetrag',
      style: { name: "Calibri", size: 11, bold: true }
    },
    {
      index: 'A16',
      heading: 'Projektertrag',
      style: { name: "Calibri", size: 11, bold: true }
    },
    {
      index: 'C17',
      heading: { formula: '=C12' },
      style: { name: "Calibri", bold: true }
    },
    {
      index: 'D17',
      heading: { formula: '=D12' },
      style: { name: "Calibri", bold: true }
    },
    {
      index: 'A17',
      heading: 'Honorarangebot',
      style: { name: "Calibri", size: 10, bold: true }
    },
    {
      index: 'E1',
      heading: company.name.toUpperCase(),
      style: { name: "Calibri" }
    },
    {
      index: 'E2',
      heading: companyAddress.toUpperCase(),
      style: { name: "Calibri" }
    }
  ];
};

export const connectedProjectXLSXHeader = (rowIndex: number): {
  rowIndex: number;
  xlsxHeader: XLSXCell[];
} => {
  const subHeader: XLSXCell[] = [
    {
      index: `C${rowIndex}`,
      heading: 'Rechnung',
      style: { name: "Calibri", size: 11, bold: true },
      alignment: { horizontal: 'right' }
    },
    {
      index: `D${rowIndex}`,
      heading: 'Rechnung',
      style: { name: "Calibri", size: 11, bold: true },
      alignment: { horizontal: 'right' }
    },
    {
      index: `A${++rowIndex}`,
      heading: 'Rechnungen',
      style: { name: "Calibri", size: 11, bold: true }
    },
    {
      index: `B${rowIndex}`,
      heading: 'Datum',
      style: { name: "Calibri", size: 11, bold: true },
      alignment: { horizontal: 'right' }
    },
    {
      index: `C${rowIndex}`,
      heading: '(exkl. MWST)',
      style: { name: "Calibri" },
      alignment: { horizontal: 'right' }
    },
    {
      index: `D${rowIndex}`,
      heading: '(inkl. MWST)',
      style: { name: "Calibri" },
      alignment: { horizontal: 'right' }
    },
    {
      index: `E${rowIndex}`,
      heading: 'Status',
      style: { name: "Calibri", size: 11, bold: true },
      alignment: { horizontal: 'right' }
    }
  ];

  return {
    rowIndex,
    xlsxHeader: subHeader
  }
};