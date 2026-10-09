import { JSDOM } from 'jsdom';
import { escape } from 'lodash';
import { DOMParser, XMLSerializer } from 'xmldom';
import { PDFDocument } from 'pdf-lib';

import Company from 'src/database/models/companies.model';
import Invoice from 'src/database/models/invoices.model';
import NumberEntry from 'src/database/models/numbers.model';
import Offer from 'src/database/models/offers.model';
import Option from 'src/database/models/options.model';
import Project from 'src/database/models/projects.model';
import ProjectDetails from 'src/database/models/project-details.model';
import ProjectEvents from 'src/database/models/project-events.model';
import ProjectCostEstimates from 'src/database/models/project-cost-estimates.model';
import ProjectProducts from 'src/database/models/project-products.model';
import ProjectAdditionalCosts from 'src/database/models/project-additional-costs.model';
import { InvoiceDetailDto } from 'src/modules/invoices/dto';
import { BadRequestError } from './base.error';
import { formatDateToDotSeparated } from './date-utils';
import OfferDetail from 'src/database/models/offer-details.model';
import OfferAdditionalCost from 'src/database/models/offer-additional-cost.model';
import OfferEvent from 'src/database/models/offer-event.model';
import OfferCostEstimate from 'src/database/models/offer-cost-estimate.model';
import OfferQuoteItem from 'src/database/models/offer-quote-item.model';
import OfferInternalDesc from 'src/database/models/offer-internal-desc.model';
import ProjectLabels from 'src/database/models/project-labels.model';
import InvoiceAdditionalCost from 'src/database/models/invoice-additional-costs.model';
import InvoiceDetail from 'src/database/models/invoice-details.model';
import InvoiceLabel from 'src/database/models/invoice-labels.model';
import InvoicePayments from 'src/database/models/invoice-payments.model';
import InvoiceProduct from 'src/database/models/invoice-products.model';

const getDocument = async (documentId: number, companyId: number, type: string) => {
  let data: Offer | Invoice | Project = null;

  switch (type) {
    case 'offer':
    case 'docx-offer':
    case 'project_offer':
      data = await Offer.findOne({
        where: { id: documentId, company_id: companyId },
        include: [
          {
            model: OfferDetail,
            as: 'details',
            include: [
              {
                model: OfferAdditionalCost,
                as: 'additional_cost',
              },
              {
                model: OfferEvent,
                as: 'events',
              },
              {
                model: OfferCostEstimate,
                as: 'cost_estimate',
                // To make `order` work inside include, we need to add `separate: true`
                separate: true,
                order: ['order'],
              },
              {
                model: OfferQuoteItem,
                as: 'quote_items',
              },
              {
                model: OfferInternalDesc,
                as: 'internal_desc',
              },
            ],
          },
        ],
      });
      data = data.get({ plain: true });
      break;
    case 'invoice':
    case 'docx-invoice':
      data = await Invoice.findOne({
        where: { id: documentId, company_id: companyId },
        include: [
          {
            model: NumberEntry,
            as: 'number',
          },
          {
            model: InvoiceDetail,
            as: 'details',
            include: [
              {
                model: InvoiceAdditionalCost,
                as: 'additional_costs',
              },
              {
                model: InvoiceLabel,
                as: 'internal_descs',
              },
              {
                model: InvoiceProduct,
                as: 'quote_items',
              },
              {
                model: InvoicePayments,
                as: 'paid_histories',
              },
            ],
          },
        ],
      });
      data = data.get({ plain: true });
      break;
    case 'project':
    case 'docx-project':
      data = await Project.findOne({
        where: { id: documentId, company_id: companyId },
        include: [
          {
            model: NumberEntry,
            as: 'number',
          },
          {
            model: ProjectDetails,
            as: 'details',
            include: [
              {
                model: ProjectAdditionalCosts,
                as: 'additional_cost',
              },
              {
                model: ProjectEvents,
                as: 'events',
              },
              {
                model: ProjectCostEstimates,
                as: 'cost_estimate',
                separate: true,
                order: ['id'],
              },
              {
                model: ProjectProducts,
                as: 'quote_items',
              },
              {
                model: ProjectLabels,
                as: 'internal_desc',
              },
            ],
          },
        ],
      });
      data = data.get({ plain: true });
      break;
    default:
      throw new BadRequestError(`Unsupported document type: ${type}`);
  }

  return data;
};

const getDefaultOption = () => {
  const options = new Option({
    values: {
      tableWidths: [2300, 500, 500, 600, 500, 600],
      invoiceHistoryTableBreak: false,
      tableHeader: true,
      invoiceHistoryTableHeader: true,
    },
  });
  return options;
};

const getCustomerTitle = (customerTitle: string) => {
  const titleMap: Record<string, string> = {
    mr: 'Herr',
    ms: 'Frau',
  };

  return titleMap[customerTitle || ''] || 'Familie';
};

const getInvoiceTotal = (invoices: Invoice[] | null): number => {
  if (!invoices) {
    return 0;
  }

  let total = 0;

  for (const invoice of invoices) {
    const quotes = invoice.details?.quote_items || [];
    let invAmount = 0;
    let amountNk = 0;

    for (const quote of quotes) {
      if (quote.type === 'title') {
        continue;
      }

      if ('is_nk' in quote && (typeof quote.is_nk === 'string' ? quote.is_nk === 'true' : quote.is_nk)) {
        amountNk += quote.cost;
      } else {
        invAmount += quote.cost;
      }

      if (invoice.details?.discount_percent > 0) {
        invAmount -= (invAmount * invoice.details.discount_percent) / 100;
      }

      total += invAmount + amountNk;
    }
  }

  return total;
};

/**
 * Gets the currency of a document or a company.
 * @param document - The document to get the currency from.
 * @param company - The company to get the currency from.
 * @returns The currency of the document or the company.
 */
const getCurrency = (
  document: Record<string, string | Record<string, string | number>[]>,
  company: Company,
): string | Record<string, string | number>[] => {
  const currency = document.currency ? document.currency : company.currency;
  return currency;
};

/**
 * Gets the table for a document.
 * @param dummy - The dummy data.
 * @param company - The company.
 * @returns The table for the document.
 */
const getTable = (dummy: Record<string, string | Record<string, string | number>[]>, company: Company): string => {
  // table header
  const headerTable = [
    `<table:table-cell table:style-name="TableDefault.H1">
      <text:p text:style-name="PStandard"><text:span text:style-name="TableHeaderSpan">Dienstleistungen</text:span></text:p>
    </table:table-cell>`,
    `<table:table-cell table:style-name="TableDefault.H1">
      <text:p text:style-name="T_END"><text:span text:style-name="TableHeaderSpan">Menge</text:span></text:p>
    </table:table-cell>`,
    `<table:table-cell table:style-name="TableDefault.H1">
      <text:p text:style-name="T_END"><text:span text:style-name="TableHeaderSpan">Einheit</text:span></text:p>
    </table:table-cell>`,
    `<table:table-cell table:style-name="TableDefault.H1">
      <text:p text:style-name="T_END"><text:span text:style-name="TableHeaderSpan">Preis<text:line-break/>${getCurrency(dummy, company)}</text:span></text:p>
    </table:table-cell>`,
    `<table:table-cell table:style-name="TableDefault.H1">
      <text:p text:style-name="T_END"><text:span text:style-name="TableHeaderSpan">MWST<text:line-break/>in %</text:span></text:p>
    </table:table-cell>`,
    `<table:table-cell table:style-name="TableDefault.H1">
      <text:p text:style-name="T_END"><text:span text:style-name="TableHeaderSpan">Kosten<text:line-break/>${getCurrency(dummy, company)}</text:span></text:p>
    </table:table-cell>`,
  ];

  // table body
  const bodyTable: string[][] = [];
  const quote_items = dummy.quote_items as Record<string, string | number>[];

  for (const val of quote_items) {
    if (typeof val.is_nk === 'string' ? val.is_nk === 'true' : val.is_nk) {
      continue;
    }

    if (val.type === 'title') {
      const contentCol = `<strong>${val.description}</strong>`;
      const column = `<table:table-cell table:style-name="TableCell" table:number-columns-spanned="6">
        <text:p text:style-name="PStandard">${convertHtmlToOXmlString(contentCol)}</text:p>
      </table:table-cell>`;
      bodyTable.push([
        column,
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
      ]);
    } else if (val.type === 'textfield') {
      const contentCol = `${((val.description || '') as string).replace(/\r\n|\r|\n/g, '<br/>')}`;
      const column = `<table:table-cell table:style-name="TableCell" table:number-columns-spanned="6">
        <text:p text:style-name="PStandard">${convertHtmlToOXmlString(contentCol)}</text:p>
      </table:table-cell>`;
      bodyTable.push([
        column,
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
        '<table:covered-table-cell/>',
      ]);
    } else {
      const contentCol1 = `<strong>${val.name}</strong><br/>${((val.description || '') as string).replace(/\r\n|\r|\n/g, '<br/>')}`;
      const row = [
        `<table:table-cell table:style-name="TableCell">
          <text:p text:style-name="PStandard">${convertHtmlToOXmlString(contentCol1)}</text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableCell">
          <text:p text:style-name="T_END">${formatNumber(val.amount)}</text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableCell">
          <text:p text:style-name="T_END">${formatUnitName(dummy, company, val.unit.toString())}</text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableCell">
          <text:p text:style-name="T_END">${formatNumber(val.price)}</text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableCell">
          <text:p text:style-name="T_END">${val.vat_rate}</text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableCell">
          <text:p text:style-name="T_END">${val.optional ? `(${formatNumber(val.cost)})` : formatNumber(val.cost)}</text:p>
        </table:table-cell>`,
      ];
      bodyTable.push(row);
    }
  }

  const odtTableData: string = `
  <table:table table:name="TableDefault" table:style-name="TableDefault">
    <table:table-column table:style-name="TableDefault.A"/>
    <table:table-column table:style-name="TableDefault.B"/>
    <table:table-column table:style-name="TableDefault.C"/>
    <table:table-column table:style-name="TableDefault.D"/>
    <table:table-column table:style-name="TableDefault.E"/>
    <table:table-column table:style-name="TableDefault.F"/>
    <table:table-row>
      ${headerTable.map((headerCol) => headerCol).join('')}
    </table:table-row>
    ${bodyTable.map((row) => `<table:table-row>${row.map((cell) => cell).join('')}</table:table-row>`).join('')}
  </table:table>
  <text:p></text:p>`;

  return odtTableData;
};

/**
 * Gets the table sum for a document.
 * @param dummy - The dummy data.
 * @param invoices - The invoices.
 * @param singleBottomLine - The flag to show single bottom line.
 * @returns The table sum for the document.
 */
const getTableSum = (
  dummy: Record<string, string | Record<string, string | number>[]>,
  invoices: Invoice[] | null = null,
  singleBottomLine: boolean = false,
): string => {
  interface VatObject {
    vat: number;
    cost: number;
    total: number;
  }

  // table sum
  let vatArr: VatObject[] = [];
  let totalCost: number = 0.0;
  let totalApplyDiscount: number = 0.0;
  let vat: number = 0.0;
  // let remainingNet: number = 0.0;
  // const remainingGross: number = 0.0; // unused
  let addPercent: string = '';
  let addPercentVal: number = 0.0;
  let addValue: number = 0.0;
  let applyNK: boolean = false;
  let notUseTotal: boolean = false;

  // total cost
  const quote_items = dummy.quote_items as Record<string, string | number>[];
  for (const val of quote_items) {
    if (val.type === 'individual' && !val.optional) {
      // exclude additional in offer and project
      if (!(typeof val.is_nk === 'string' ? val.is_nk === 'true' : val.is_nk)) {
        totalCost += +val.cost;
      } else {
        applyNK = true;
        addPercent = val.name.toString();
        const matches = addPercent.toString().match(/\d+(?:\.\d+)?%$/);
        if (matches) {
          addPercentVal = parseFloat(matches[0]);
        }
        addValue = +val.price;
      }
      // group vat
      vatArr.push({
        vat: +val.vat_rate,
        cost: 0,
        total: 0,
      });

      // exclude not applied discount items to calculate discount for invoice
      if (val.apply_discount) {
        notUseTotal = true;
      } else {
        totalApplyDiscount += +val.cost;
      }
    }
  }

  // discount
  const discount = (totalApplyDiscount * +dummy.discount_percent) / 100;

  // total net
  const totalNet = totalCost - discount;

  // remaining net
  // remainingNet = totalNet - getInvoiceTotal(invoices) + addValue;  // unused

  // vat list
  vatArr = arrayUnique(vatArr);
  let vatTotal = 0;
  let vatApplyDiscount = 0;
  const dummyQuoteItems = dummy.quote_items as Record<string, string | number>[];

  for (const vatItem of vatArr) {
    for (const quote of dummyQuoteItems) {
      if (!quote.vat_rate) {
        continue;
      }
      if (+dummy.discount_percent > 0 && vatItem.vat == quote.vat_rate && !quote.optional) {
        // exclude not applied discount items to calculate discount for invoice
        let cost = +quote.cost;
        if (typeof quote.is_nk === 'string' ? quote.is_nk === 'true' : quote.is_nk) {
          cost = +quote.price;
        }
        if (!quote.apply_discount) {
          vatApplyDiscount += cost;
        }
        vatTotal += cost;
      } else if (vatItem.vat == quote.vat_rate && !quote.optional) {
        vatTotal += +quote.cost;
        vatApplyDiscount += +quote.cost;
      }
    }
    vatTotal -= (vatApplyDiscount * +dummy.discount_percent) / 100;
    vatItem.total = vatTotal;
    vatItem.cost = (vatTotal * vatItem.vat) / 100;
    vatTotal = 0;
    vatApplyDiscount = 0;
  }

  // total gross
  vat = vatArr.reduce((acc, val) => acc + val.cost, 0);
  const totalGross = roundNumber(totalNet + vat) + roundNumber(addValue);

  // remaining gross
  if (invoices && invoices.length > 0) {
    // remainingGross = remainingNet + vat;  // unused
  }

  // table sum
  let isBorderTopAdded = false;
  const tableSum: string[][] = [];
  if (+dummy.discount_percent > 0 || applyNK) {
    const discountRow = [
      `<table:table-cell table:style-name="TableSum.H1" table:number-columns-spanned="3">
        <text:p text:style-name="PStandard"><text:span text:style-name="Bold">Total</text:span></text:p>
      </table:table-cell>`,
      '<table:covered-table-cell/>',
      '<table:covered-table-cell/>',
      `<table:table-cell table:style-name="TableSum.H1">
        <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(totalCost)}</text:span></text:p>
      </table:table-cell>`,
    ];
    tableSum.push(discountRow);
  }

  if (+dummy.discount_percent > 0) {
    const discountRow1 = [
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="PStandard">Rabatt ${dummy.discount_percent}%</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END">${formatNumber(totalCost)}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END">-${formatNumber(+dummy.discount_percent, 0, 0, 1, '.', "'")}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END">-${formatNumber(discount)}</text:p>
      </table:table-cell>`,
    ];
    tableSum.push(discountRow1);

    const discountRow2 = [
      `<table:table-cell table:style-name="TableSumCell" table:number-columns-spanned="3">
        <text:p text:style-name="PStandard"><text:span text:style-name="Bold">Total inkl. Rabatt</text:span></text:p>
      </table:table-cell>`,
      '<table:covered-table-cell/>',
      '<table:covered-table-cell/>',
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(totalCost - discount)}</text:span></text:p>
      </table:table-cell>`,
    ];
    tableSum.push(discountRow2);

    isBorderTopAdded = true;
  }

  if (applyNK) {
    let addPercentRow = [
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="PStandard">${addPercent}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END">${formatNumber(notUseTotal ? totalCost - discount : totalCost)}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END">${formatNumber(addPercentVal, 0, 0, 1, '.', "'")}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END">${formatNumber(addValue, 0)}</text:p>
      </table:table-cell>`,
    ];

    if (!isBorderTopAdded) {
      addPercentRow = [
        `<table:table-cell table:style-name="TableSumCell">
          <text:p text:style-name="PStandard"><text:span text:style-name="Bold">${addPercent}</text:span></text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableSumCell">
          <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(notUseTotal ? totalCost - discount : totalCost)}</text:span></text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableSumCell">
          <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(addPercentVal, 0, 0, 1, '.', "'")}</text:span></text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableSumCell">
          <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(addValue, 0)}</text:span></text:p>
        </table:table-cell>`,
      ];
    }

    tableSum.push(addPercentRow);
    isBorderTopAdded = true;
  }

  const netRow = [
    `<table:table-cell table:style-name="${isBorderTopAdded ? 'TableSumCell' : 'TableSum.H1'}" table:number-columns-spanned="3">
      <text:p text:style-name="PStandard"><text:span text:style-name="Bold">Total exkl. MWST.</text:span></text:p>
    </table:table-cell>`,
    '<table:covered-table-cell/>',
    '<table:covered-table-cell/>',
    `<table:table-cell table:style-name="${isBorderTopAdded ? 'TableSumCell' : 'TableSum.H1'}">
      <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(totalNet + addValue)}</text:span></text:p>
    </table:table-cell>`,
  ];
  tableSum.push(netRow);

  for (const vatItem of vatArr) {
    const vatRow = [
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="PStandard">Mehrwertsteuer</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END">${formatNumber(vatItem.total)}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END">${vatItem.vat}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END">${formatNumber(vatItem.cost, 0.05)}</text:p>
      </table:table-cell>`,
    ];
    tableSum.push(vatRow);
  }

  const grossRow = [
    `<table:table-cell table:style-name="${singleBottomLine ? 'TableSum.F1' : 'TableSum.F2'}" table:number-columns-spanned="3">
        <text:p text:style-name="PStandard"><text:span text:style-name="Bold">Total inkl. MWST.</text:span></text:p>
      </table:table-cell>`,
    '<table:covered-table-cell/>',
    '<table:covered-table-cell/>',
    `<table:table-cell table:style-name="${singleBottomLine ? 'TableSum.F1' : 'TableSum.F2'}">
        <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(totalGross)}</text:span></text:p>
      </table:table-cell>`,
  ];
  tableSum.push(grossRow);

  const odtTableSum: string = `<table:table table:name="TableSum" table:style-name="TableSum">
    <table:table-column table:style-name="TableSum.A"/>
    <table:table-column table:style-name="TableSum.B"/>
    <table:table-column table:style-name="TableSum.C"/>
    <table:table-column table:style-name="TableSum.D"/>
    ${tableSum.map((row) => `<table:table-row>${row.map((cell) => cell).join('')}</table:table-row>`).join('\n')}
  </table:table>
  <text:p></text:p>`;

  return odtTableSum;
};

/**
 * Gets the event table for a document.
 * @param dummy - The dummy data.
 * @returns The event table for the document.
 */
const getEventTable = (dummy: Record<string, string | Record<string, string | number>[]>): string => {
  const tableEvent: string[][] = [];
  const events = dummy.events as Record<string, string | number>[];
  for (const event of events) {
    const row = [
      `<table:table-cell table:style-name="TableCellNoPaddingY">
        <text:p text:style-name="EventTextPStandard">${event.label}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCellNoPaddingY">
        <text:p text:style-name="EventValue">${event.value}</text:p>
      </table:table-cell>`,
    ];
    tableEvent.push(row);
  }

  const odtTableEvent: string = `
  <table:table table:name="TableDefault" table:style-name="Table">
    <table:table-column table:style-name="TableColumn" table:number-columns-repeated="2"/>
      ${tableEvent.map((row) => `<table:table-row>${row.map((cell) => cell).join('')}</table:table-row>`).join('')}
  </table:table>
  <text:p><text:line-break/></text:p>`;

  return odtTableEvent;
};

/**
 //TODO: need to query it from the db
 * Formats a unit name.
 * @param dummy - The dummy data.
 * @param company - The company.
 * @param value - The unit name to format.
 * @returns The formatted unit name.
 */
const formatUnitName = (
  dummy: Record<string, string | Record<string, string | number>[]>,
  company: Company,
  value: string,
): string | Record<string, string | number>[] => {
  interface Units {
    [key: string]: {
      [key: string]: string | Record<string, string | number>[];
    };
  }

  const defaultUnitName = getCurrency(dummy, company);
  const units: Units = {
    en: {
      'unit.flatRate': defaultUnitName,
      'unit.hours': 'hr',
      'unit.kilometres': 'km',
      'unit.squareMetres': 'm2',
      'unit.expenses': 'hr',
      'unit.items': 'Items',
      Architekturhonorar: 'A',
      Bauleitungshonorar: 'B',
    },
    de: {
      'unit.flatRate': defaultUnitName,
      'unit.hours': 'h',
      'unit.kilometres': 'km',
      'unit.squareMetres': 'm2',
      'unit.expenses': 'h',
      'unit.items': 'St',
      Architekturhonorar: 'A',
      Bauleitungshonorar: 'B',
    },
  };

  return units[company.language]?.[value] ?? value;
};

/**
 * Formats a number with specified options.
 * @param value - The number to format.
 * @param interval - The interval for rounding.
 * @param precision - The precision for rounding.
 * @param decimal - The number of decimal places.
 * @param decimalSeparator - The character used as the decimal separator.
 * @param thousandsSeparator - The character used as the thousands separator.
 * @returns The formatted number as a string.
 */
function formatNumber(
  value: number | string,
  interval: number = 0.01,
  precision: number = 0,
  decimal: number = 2,
  decimalSeparator: string = '.',
  thousandsSeparator: string = "'",
): string {
  if (typeof value === 'string') {
    value = parseFloat(value.replace('%', ''));
  }

  if (interval === 0) {
    return numberFormat(roundTo(value, 2), decimal, decimalSeparator, thousandsSeparator);
  }

  return numberFormat(roundTo(value / interval, precision) * interval, decimal, decimalSeparator, thousandsSeparator);
}

/**
 * Rounds a number to the nearest multiple of 0.05.
 * @param value - The number to round.
 * @returns The rounded number.
 */
function roundNumber(value: number): number {
  return Math.round(value / 0.05) * 0.05;
}

/**
 * Removes duplicates from an array.
 * @param arr - The array to remove duplicates from.
 * @returns The array with duplicates removed.
 */
const arrayUnique = <T>(arr: T[]): T[] => {
  const uniqueArray = Array.from(new Set(arr.map((item) => JSON.stringify(item)))).map((item) => JSON.parse(item));
  return uniqueArray;
};

/**
 * Rounds a number to the specified precision.
 * @param value - The number to round.
 * @param precision - The precision for rounding.
 * @returns The rounded number.
 */
function roundTo(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Formats a number with specified decimal and thousands separators.
 * @param value - The number to format.
 * @param decimal - The number of decimal places.
 * @param decimalSeparator - The character used as the decimal separator.
 * @param thousandsSeparator - The character used as the thousands separator.
 * @returns The formatted number as a string.
 */
function numberFormat(value: number, decimal: number, decimalSeparator: string, thousandsSeparator: string): string {
  const parts = value.toFixed(decimal).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  return parts.join(decimalSeparator);
}

function getFinalSum(
  dummy: Record<string, string | Record<string, string | number>[]>,
  invoices: InvoiceDetailDto[],
  singleBottomLine: boolean,
): string {
  let vatArr: { vat: number; cost: number; total: number }[] = [];
  let totalCost = 0.0;
  let totalApplyDiscount = 0.0;
  let vat = 0.0;
  let remainingNet = 0.0;
  let remainingGross = 0.0;
  let addPercent: string = '';
  let addPercentVal = 0.0;
  let addValue = 0.0;
  let applyNK = false;

  // Total cost
  const quote_items = dummy.quote_items as Record<string, string | number>[];
  quote_items.forEach((val) => {
    if (val.type === 'individual' && !val.optional) {
      if (!(typeof val.is_nk === 'string' ? val.is_nk === 'true' : val.is_nk)) {
        totalCost += +val.cost;
      } else {
        applyNK = true;
        addPercent = val.name as string;
        const matches = addPercent.match(/\d+(?:\.\d+)?%$/);
        if (matches) {
          addPercentVal = parseFloat(matches[0]);
        }
        addValue = +val.cost;
      }

      const object = { vat: +val.vat_rate, cost: 0.0, total: 0.0 };
      vatArr.push(object);

      if (val.apply_discount) {
        totalApplyDiscount += +val.cost;
      } else {
        totalApplyDiscount += +val.cost;
      }
    }
  });

  // Discount
  const discount = (totalApplyDiscount * +dummy.discount_percent) / 100;

  // Total net
  const totalNet = totalCost - discount;

  // Remaining net
  if (Array.isArray(invoices) && invoices.length > 0) {
    let invoiceTotal = 0.0;
    invoices.forEach((val) => {
      if (!val.details.is_final) {
        invoiceTotal += val.amount;
      }
    });
    remainingNet = totalNet - invoiceTotal + addValue;
  }

  // VAT list
  vatArr = vatArr.filter((v, i, a) => a.findIndex((t) => t.vat === v.vat) === i);
  if (Array.isArray(invoices) && invoices.length > 0) {
    vatArr.forEach((val) => {
      val.total = remainingNet;
      val.cost = (remainingNet * val.vat) / 100;
    });
  }

  // Total gross
  vatArr.forEach((val) => {
    vat += val.cost;
  });
  // const totalGross = totalNet + vat + addValue;

  // Remaining gross
  if (Array.isArray(invoices) && invoices.length > 0) {
    remainingGross = remainingNet + vat;
  }

  const table: string[][] = [];
  let isBorderTopAdded = false;

  table.push([
    `<table:table-cell table:style-name="TableSum.H1" table:number-columns-spanned="3">
      <text:p text:style-name="PStandard"><text:span text:style-name="Bold">Total</text:span></text:p>
    </table:table-cell>`,
    '<table:covered-table-cell/>',
    '<table:covered-table-cell/>',
    `<table:table-cell table:style-name="TableSum.H1">
      <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(totalCost)}</text:span></text:p>
    </table:table-cell>`,
  ]);

  if (Number(dummy.discount_percent) > 0) {
    table.push([
      `<table:table-cell table:style-name="TableCell">
        <text:p text:style-name="PStandard">Rabatt ${dummy.discount_percent}%</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCell">
        <text:p text:style-name="T_END">${formatNumber(totalCost)}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCell">
        <text:p text:style-name="T_END">-${formatNumber(+dummy.discount_percent, 0, 0, 1, '.', "'")}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCell">
        <text:p text:style-name="T_END">-(${formatNumber(discount)})</text:p>
      </table:table-cell>`,
    ]);

    table.push([
      `<table:table-cell table:style-name="TableCell" table:number-columns-spanned="3">
        <text:p text:style-name="PStandard"><text:span text:style-name="Bold">Total inkl. Rabatt</text:span></text:p>
      </table:table-cell>`,
      '<table:covered-table-cell/>',
      '<table:covered-table-cell/>',
      `<table:table-cell table:style-name="TableCell">
        <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(totalCost - discount)}</text:span></text:p>
      </table:table-cell>`,
    ]);

    isBorderTopAdded = true;
  }

  if (applyNK) {
    table.push([
      `<table:table-cell table:style-name="TableCellNoPaddingY">
          <text:p text:style-name="PStandard"><text:span text:style-name="${isBorderTopAdded ? 'PStandard' : 'Bold'}">${addPercent}</text:span></text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCellNoPaddingY">
          <text:p text:style-name="T_END"><text:span text:style-name="${isBorderTopAdded ? 'PStandard' : 'Bold'}">${formatNumber(totalCost - discount)}</text:span></text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCellNoPaddingY">
        <text:p text:style-name="T_END"><text:span text:style-name="${isBorderTopAdded ? 'PStandard' : 'Bold'}">${formatNumber(addPercentVal, 0, 0, 1, '.', "'")}</text:span></text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCellNoPaddingY">
      <text:p text:style-name="T_END"><text:span text:style-name="${isBorderTopAdded ? 'PStandard' : 'Bold'}">${formatNumber(addValue)}</text:span></text:p>
    </table:table-cell>`,
    ]);

    isBorderTopAdded = true;
  }

  table.push([
    `<table:table-cell table:style-name="${isBorderTopAdded ? 'TableCellNoPaddingY' : 'TableSum.H1'}" table:number-columns-spanned="3">
      <text:p text:style-name="PStandard"><text:span text:style-name="Bold">Total exkl. MWST.</text:span></text:p>
    </table:table-cell>`,
    '<table:covered-table-cell/>',
    '<table:covered-table-cell/>',
    `<table:table-cell table:style-name="${isBorderTopAdded ? 'TableCellNoPaddingY' : 'TableSum.H1'}">
      <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(totalCost + addValue)}</text:span></text:p>
    </table:table-cell>`,
  ]);

  invoices
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // sort ascending by created_at first
    .forEach((val) => {
      if (!val.details.is_final) {
        const dt = new Date(val.created_at);
        table.push([
          `<table:table-cell table:style-name="TableCellNoPaddingY" table:number-columns-spanned="3">
          <text:p text:style-name="PStandard">${val.name} vom ${dt.getDate().toString().padStart(2, '0')}.${(dt.getMonth() + 1).toString().padStart(2, '0')}.${dt.getFullYear()}</text:p>
        </table:table-cell>`,
          '<table:covered-table-cell/>',
          '<table:covered-table-cell/>',
          `<table:table-cell table:style-name="TableCellNoPaddingY">
          <text:p text:style-name="T_END">-${formatNumber(val.amount, 0.05)}</text:p>
        </table:table-cell>`,
        ]);
      }
    });

  table.push([
    `<table:table-cell table:style-name="TableCellNoPaddingY" table:number-columns-spanned="3">
      <text:p text:style-name="PStandard">Restbetrag exkl. MWST</text:p>
    </table:table-cell>`,
    '<table:covered-table-cell/>',
    '<table:covered-table-cell/>',
    `<table:table-cell table:style-name="TableCellNoPaddingY">
      <text:p text:style-name="T_END">${formatNumber(remainingNet, 0.05)}</text:p>
    </table:table-cell>`,
  ]);

  vatArr.forEach((val) => {
    table.push([
      `<table:table-cell table:style-name="TableCellNoPaddingY">
        <text:p text:style-name="PStandard">Mehrwertsteuer</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCellNoPaddingY">
        <text:p text:style-name="T_END">${formatNumber(val.total, 0.05)}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCellNoPaddingY">
        <text:p text:style-name="T_END">${val.vat}</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCellNoPaddingY">
        <text:p text:style-name="T_END">${formatNumber(val.cost, 0.05)}</text:p>
      </table:table-cell>`,
    ]);
  });

  table.push([
    `<table:table-cell table:style-name="${singleBottomLine ? 'TableSum.F1' : 'TableSum.F2'}" table:number-columns-spanned="3">
      <text:p text:style-name="PStandard"><text:span text:style-name="Bold">Total inkl. MWST.</text:span></text:p>
    </table:table-cell>`,
    '<table:covered-table-cell/>',
    '<table:covered-table-cell/>',
    `<table:table-cell table:style-name="${singleBottomLine ? 'TableSum.F1' : 'TableSum.F2'}">
      <text:p text:style-name="T_END"><text:span text:style-name="Bold">${formatNumber(remainingGross, 0.05)}</text:span></text:p>
    </table:table-cell>`,
  ]);

  return `
  <table:table table:name="TableSum" table:style-name="TableSum">
    <table:table-column table:style-name="TableSum.A"/>
    <table:table-column table:style-name="TableSum.B"/>
    <table:table-column table:style-name="TableSum.C"/>
    <table:table-column table:style-name="TableSum.D"/>
    ${table.map((row) => `<table:table-row>${row.map((cell) => cell).join('')}</table:table-row>`).join('\n')}
  </table:table>`;
}

function getInvoiceTable(
  dummy: Record<string, string | Record<string, string | number>[]>,
  invoices: InvoiceDetailDto[],
  company: Company,
  optionValues: Record<string, boolean | number[]> | null,
  isInvoice: boolean = false,
): string {
  let remaining = 0;
  let totalCost = 0.0;
  let totalNet = 0.0;
  let addValue = 0.0;

  // Total cost
  const quote_items = dummy.quote_items as Record<string, string | number | boolean>[];
  quote_items.forEach((val) => {
    if (val.type === 'individual' && !val.optional) {
      if (!(typeof val.is_nk === 'string' ? val.is_nk === 'true' : val.is_nk)) {
        totalCost += +val.cost;
      } else {
        addValue = +val.cost;
      }
    }
  });

  // Discount
  const discount = (totalCost * +dummy.discount_percent) / 100;

  // Total net
  totalNet = totalCost - discount;
  if (dummy && isInvoice) {
    totalNet = 0;
    const project_quote_items = dummy.quote_items as Record<string, string | number>[];
    project_quote_items.forEach((value) => {
      if (value.price && +value.price > 0) {
        totalNet += +value.amount * +value.price;
      }
    });
    totalNet -= (totalNet * +dummy.discount_percent) / 100;
  }

  // Remaining
  let totalInvoice = 0.0;
  invoices.forEach((val) => {
    // If the amount is not a number, set it to 0. Otherwise, add it to the total invoice amount.
    if (!Number.isNaN(+val.amount)) {
      totalInvoice += +val.amount;
    } else {
      val.amount = 0;
    }
  });
  remaining = totalNet + addValue - totalInvoice;

  // Generate HTML table
  const bodyTable: string[][] = [];

  if (Array.isArray(invoices) && invoices.length) {
    // Add table header
    bodyTable.push([
      `<table:table-cell table:style-name="TableSumCell" table:number-columns-spanned="2">
        <text:p text:style-name="PStandard"><text:span text:style-name="Bold">Rechnungsübersicht</text:span></text:p>
      </table:table-cell>`,
      '<table:covered-table-cell/>',
    ]);

    bodyTable.push([
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="PStandard">Auftrag</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END"><text:span text:style-name="Bold">${getCurrency(dummy, company)} ${formatNumber(totalNet + addValue)}</text:span></text:p>
      </table:table-cell>`,
    ]);

    // Add table body
    invoices.forEach((val) => {
      const dt = new Date(val.created_at);
      bodyTable.push([
        `<table:table-cell table:style-name="TableSumCell">
          <text:p text:style-name="PStandard">${val.name} vom ${dt.toLocaleDateString('de-DE')}</text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableSumCell">
          <text:p text:style-name="T_END">${getCurrency(dummy, company)} ${val.amount > 0 ? '-' + formatNumber(val.amount) : '0.00'}</text:p>
        </table:table-cell>`,
      ]);
    });

    bodyTable.push([
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="PStandard">Restbetrag</text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableSumCell">
        <text:p text:style-name="T_END"><text:span text:style-name="Bold">${getCurrency(dummy, company)} ${formatNumber(remaining)}</text:span></text:p>
      </table:table-cell>`,
    ]);
  }

  const invoiceTable: string = `
  <table:table table:name="InvoiceTable" table:style-name="InvoiceTable">
    <table:table-column table:style-name="InvoiceTable.A"/>
    <table:table-column table:style-name="InvoiceTable.B"/>
    ${
      optionValues?.invoiceHistoryTableBreak
        ? `
      <table:table-row>
        <table:table-cell table:number-columns-spanned="2"><text:p text:style-name="PStandard"><text:line-break/></text:p></table:table-cell>
      </table:table-row>`
        : ''
    }
    ${bodyTable.map((row) => `<table:table-row>${row.map((cell) => cell).join('')}</table:table-row>`).join('')}
  </table:table>`;

  return invoiceTable;
}

const getOption = async (companyId: number, documentId: number, type: string): Promise<Option | null> => {
  const options = (await Option.findOne({
    where: { company_id: companyId, document_id: documentId, type: type },
    raw: true,
  })) as Option;

  return options;
};

/**
 * Parse HTML content into OpenOffice XML format.
 * @param {string} htmlContent - The HTML content to convert.
 * @returns {DocumentFragment} Document fragment in OpenOffice XML format.
 */
function convertHtmlToOXml(htmlContent: string): DocumentFragment {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  const xmlDocument = new DOMParser().parseFromString('<root/>', 'text/xml');

  /**
   * Recursive function to process a node and its children.
   * @param {ChildNode} node - The node to process.
   * @param {Node} parent - The parent node in the XML document.
   */
  function processNode(node: ChildNode, parent: Node) {
    if (node.nodeType === 3) {
      // Text node
      if (node.textContent) {
        // Add Normal style for text nodes
        const textNode = xmlDocument.createTextNode(node.textContent);
        parent.appendChild(textNode);
      }
    } else if (node.nodeType === 1) {
      // Element node
      const element = node as HTMLElement;

      let newXmlNode: Element;
      switch (element.tagName.toUpperCase()) {
        case 'B':
        case 'STRONG':
          newXmlNode = xmlDocument.createElement('text:span');
          newXmlNode.setAttribute('text:style-name', 'Bold');
          break;
        case 'EM':
        case 'I':
          newXmlNode = xmlDocument.createElement('text:span');
          newXmlNode.setAttribute('text:style-name', 'Italic');
          break;
        case 'U':
          newXmlNode = xmlDocument.createElement('text:span');
          newXmlNode.setAttribute('text:style-name', 'Underline');
          break;
        case 'BR':
          newXmlNode = xmlDocument.createElement('text:line-break');
          parent.appendChild(newXmlNode);
          return;
        case 'P':
          newXmlNode = xmlDocument.createElement('text:span');
          if (element.parentElement && element.parentElement.tagName.toUpperCase() === 'BODY') {
            newXmlNode.setAttribute('text:style-name', 'Normal');
          }
          copyAttributes(element, newXmlNode);
          break;
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
          newXmlNode = xmlDocument.createElement('text:span');
          newXmlNode.setAttribute('text:style-name', element.tagName.toUpperCase());
          copyAttributes(element, newXmlNode);
          break;
        default:
          newXmlNode = xmlDocument.createElement('text:span');
          if (element.parentElement && element.parentElement.tagName.toUpperCase() === 'BODY') {
            newXmlNode.setAttribute('text:style-name', 'Normal');
          }
          copyAttributes(element, newXmlNode);
          break;
      }

      parent.appendChild(newXmlNode);
      // Append line break after heading elements
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName.toUpperCase())) {
        const lineBreak = xmlDocument.createElement('text:line-break');
        parent.appendChild(lineBreak);
      }
      processChildren(element, newXmlNode);
    }
  }

  /**
   * Copy attributes from one element to another.
   * @param {HTMLElement} source - The source element.
   * @param {Element} target - The target element.
   */
  function copyAttributes(source: HTMLElement, target: Element) {
    Array.from(source.attributes).forEach((attr) => {
      target.setAttribute(attr.name, attr.value);
    });
  }

  /**
   * Process all child nodes of a given node.
   * @param {Node} parentNode - The parent node whose children will be processed.
   * @param {Node} xmlParentNode - The XML parent node.
   */
  function processChildren(parentNode: Node, xmlParentNode: Node) {
    Array.from(parentNode.childNodes).forEach((childNode) => {
      processNode(childNode, xmlParentNode);
    });
  }

  const fragment = xmlDocument.createDocumentFragment();
  processChildren(document.body, fragment);
  return fragment;
}

/**
 * Parse HTML content into OpenOffice XML format and return it as a string.
 * @param {string} htmlContent - The HTML content to convert.
 * @returns {string} OpenOffice XML string.
 */
function convertHtmlToOXmlString(htmlContent: string): string {
  const xmlContent = convertHtmlToOXml(htmlContent);
  // Serialize the XML document to a string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlContent);
}

function addFieldValuesIfNotExisted(
  contentKeys: string[],
  breakPageKeys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  const PAGE_BREAK = '<div style="page-break-after: always;"></div>';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let newMetadata: Record<string, any> = {};
  for (const key of breakPageKeys) {
    newMetadata = { ...newMetadata, [key]: metadata[key] ? PAGE_BREAK : '' };
  }

  for (const key of contentKeys) {
    if (metadata[key]) {
      if (typeof key !== 'string' || typeof metadata[key] !== 'string') {
        continue;
      }

      // Create a copy of the value instead of modifying the original
      let formattedValue = metadata[key];

      if (key === 'date') {
        formattedValue = formatDateToDotSeparated(metadata[key]);
      } else if (key === 'title' || key === 'location') {
        formattedValue = escape(metadata[key]);
      } else if (key === 'end_desc' && metadata['payment_deadline']) {
        formattedValue = metadata[key].replace('[duration]', metadata['payment_deadline']);
      }

      newMetadata = { ...newMetadata, [key]: formattedValue };
    } else {
      newMetadata = { ...newMetadata, [key]: '' };
    }
  }

  return newMetadata;
}

/**
 * Clear the redundant HTML tags at the end.
 * @param {string} htmlContent - The HTML content to .
 * @returns {string} OpenOffice XML string.
 */
function removeRedundantTagsAtEnd(htmlContent: string): string {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  const body = document.body;

  const children = Array.from(body.children);

  for (let i = children.length - 1; i >= 0; i--) {
    const element = children[i];

    if (element.tagName.toLowerCase() === 'br') {
      element.remove();
    } else if (
      element.tagName.toLowerCase() === 'p' &&
      (!element.textContent?.trim() || element.innerHTML.trim() === '<br>')
    ) {
      element.remove();
    } else if (!element.textContent?.trim() && element.children.length === 0) {
      element.remove();
    } else {
      break;
    }
  }

  return body.innerHTML;
}

/**
 * Combines multiple PDF buffers into a single PDF buffer.
 * @param {Buffer[]} buffers - The PDF buffers to combine (in left-to-right order).
 * @returns {Promise<Buffer>} The combined PDF buffer.
 */
const combinePdfBuffers = async (buffers: Buffer[]): Promise<Buffer> => {
  const pdf = await PDFDocument.create();
  for (const buffer of buffers) {
    const pdfDoc = await PDFDocument.load(buffer);
    const copiedPages = await pdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => pdf.addPage(page));
  }
  const mergedPdf = await pdf.save();
  return Buffer.from(mergedPdf);
};

export {
  addFieldValuesIfNotExisted,
  formatNumber,
  getCurrency,
  getFinalSum,
  getInvoiceTable,
  getOption,
  convertHtmlToOXmlString,
  convertHtmlToOXml,
  getDocument,
  getDefaultOption,
  getCustomerTitle,
  getInvoiceTotal,
  getTable,
  getTableSum,
  getEventTable,
  removeRedundantTagsAtEnd,
  combinePdfBuffers,
};
