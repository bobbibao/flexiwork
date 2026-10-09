import User from 'src/database/models/users.model';
import NumberEntry from 'src/database/models/numbers.model';
import Invoice from 'src/database/models/invoices.model';
import Project from 'src/database/models/projects.model';
import Offer from 'src/database/models/offers.model';
import { ExportCode } from '../constants';
import { formatDateToYYYYMMDD } from 'src/shared/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateFileName = async (exportType: string, user: User, options: any): Promise<string> => {
  let fileName: string = 'preview';

  switch (exportType) {
    case ExportCode.OFFER: {
      // Offerte_{offer_number_id}.*
      const offer = await Offer.findByPk(options.id, {
        attributes: ['number_id'],
        raw: true,
      });
      const offerNumber = await NumberEntry.findByPk(offer.number_id, {
        attributes: ['custom_id'],
        raw: true,
      });
      fileName = `Offerte_${offerNumber?.custom_id || offer?.number_id || ''}`;
      break;
    }
    // Invoice page
    case ExportCode.PROJECT: {
      // Auftragsbestatigung_{project_number_id}.*
      const project = await Project.findByPk(options.id, {
        attributes: ['number_id'],
        include: [
          {
            model: NumberEntry,
            as: 'number',
            attributes: ['custom_id'],
            where: {
              type: 'project',
              company_id: user.company_id,
              ref_id: options.id,
            },
            required: true,
          },
        ],
      });
      fileName = `Auftragsbestatigung_${project?.number?.custom_id || project?.number_id || ''}`;
      break;
    }
    // Project page
    case ExportCode.INVOICE: {
      // {invoice_name}.*
      const invoice = await Invoice.findByPk(options.id, {
        attributes: ['name'],
        raw: true,
      });
      fileName = invoice.name || '';
      break;
    }
    // Report page - Addresses tab
    case ExportCode.REPORT_ADDRESS: {
      // Addresse_{export_date}.*
      fileName = `Addresse_${formatDateToYYYYMMDD(new Date()) || ''}`;
      break;
    }
    // Report page - Offers tab
    case ExportCode.REPORT_OFFER: {
      // Angebote_{export_date}.*
      fileName = `Angebote_${formatDateToYYYYMMDD(new Date()) || ''}`;
      break;
    }
    // Report page - Projects tab - List of projects
    case ExportCode.REPORT_PROJECT: {
      // Auftragsliste_{export_date}.*
      fileName = `Auftragsliste_${formatDateToYYYYMMDD(new Date()) || ''}`;
      break;
    }
    // Report page - Projects tab - Internal Export [Print PDF]
    case ExportCode.REPORT_EFFORTS_INTERNAL: {
      // {prj_number} {prj_title} - Intern - {start_date} - {end_date}.*
      const { id, start, end } = options;
      const project = await Project.findByPk(id, {
        attributes: ['name'],
        include: [
          {
            model: NumberEntry,
            as: 'number',
            attributes: ['custom_id'],
            where: {
              type: 'project',
              company_id: user.company_id,
              ref_id: id,
            },
            required: true,
          },
        ],
      });
      fileName = `${project.number.custom_id || ''} ${project.name || ''} - Intern - ${formatDateToYYYYMMDD(new Date(start))} - ${formatDateToYYYYMMDD(new Date(end))}`;
      break;
    }
    // Report page - Projects tab - External Export [Print PDF]
    case ExportCode.REPORT_EFFORTS_EXTERNAL: {
      // {prj_number} {prj_title} - Extern - {start_date} - {end_date}.*
      const { id, start, end } = options;
      const project = await Project.findByPk(id, {
        attributes: ['name'],
        include: [
          {
            model: NumberEntry,
            as: 'number',
            attributes: ['custom_id'],
            where: {
              type: 'project',
              company_id: user.company_id,
              ref_id: id,
            },
            required: true,
          },
        ],
      });
      fileName = `${project.number.custom_id || ''} ${project.name || ''} - Extern - ${formatDateToYYYYMMDD(new Date(start))} - ${formatDateToYYYYMMDD(new Date(end))}`;
      break;
    }
    // Report page - Projects Summary tab
    case ExportCode.REPORT_PROJECT_ALL_INVOICES: {
      // {prj_number} {prj_title} - Projektübersicht - {export_date}.*
      const { id } = options;
      const project = await Project.findByPk(id, {
        attributes: ['name'],
        include: [
          {
            model: NumberEntry,
            as: 'number',
            attributes: ['custom_id'],
            where: {
              type: 'project',
              company_id: user.company_id,
              ref_id: id,
            },
            required: true,
          },
        ],
      });
      fileName = `${project.number.custom_id || ''} ${project.name || ''} - Projektübersicht - ${formatDateToYYYYMMDD(new Date())}`;
      break;
    }
    // Report page - Invoices tab
    case ExportCode.REPORT_INVOICES: {
      // Rechnungen_{export_date}.*
      fileName = `Rechnungen_${formatDateToYYYYMMDD(new Date()) || ''}`;
      break;
    }
    // Report page - Employees tab - List of current employees
    case ExportCode.REPORT_EMPLOYEE: {
      // Mitarbeiterliste-{export_date}.*
      fileName = `Mitarbeiterliste-${formatDateToYYYYMMDD(new Date()) || ''}`;
      break;
    }
    // Report page - Employees tab - List of current employees with job and rate
    case ExportCode.REPORT_EMPLOYEE_WITH_RATE: {
      // Mitarbeiterliste mit hk und tarifen-{export_date}.*
      fileName = `Mitarbeiterliste mit hk und tarifen-${formatDateToYYYYMMDD(new Date()) || ''}`;
      break;
    }
  }

  return fileName;
};
