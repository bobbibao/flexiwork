import { Provider } from '@nestjs/common';
import Invoice from 'src/database/models/invoices.model';
import Log from 'src/database/models/logs.model';
import NumberEntry from 'src/database/models/numbers.model';
import ProjectPull from 'src/database/models/project-pulls.model';
import Project from 'src/database/models/projects.model';
import Setting from 'src/database/models/setting.model';
import ProjectDetails from 'src/database/models/project-details.model';
import ProjectProducts from 'src/database/models/project-products.model';
import ProjectLabels from 'src/database/models/project-labels.model';
import ProjectEvents from 'src/database/models/project-events.model';
import ProjectCostEstimates from 'src/database/models/project-cost-estimates.model';
import ProjectAdditionalCosts from 'src/database/models/project-additional-costs.model';
import CompanyTemplate from 'src/database/models/company-templates.model';
import ProjectComment from 'src/database/models/project-comments.model';

export const ProjectProvider: Provider[] = [
  {
    provide: 'PROJECT_REPOSITORY',
    useValue: Project,
  },
  {
    provide: 'PROJECT_PULL_REPOSITORY',
    useValue: ProjectPull,
  },
  {
    provide: 'INVOICE_REPOSITORY',
    useValue: Invoice,
  },
  {
    provide: 'SETTING_REPOSITORY',
    useValue: Setting,
  },
  {
    provide: 'LOG_REPOSITORY',
    useValue: Log,
  },
  {
    provide: 'COMPANY_TEMPLATE_REPOSITORY',
    useValue: CompanyTemplate,
  },
  {
    provide: 'NUMBER_REPOSITORY',
    useValue: NumberEntry,
  },
  {
    provide: 'PROJECT_DETAILS_REPOSITORY',
    useValue: ProjectDetails,
  },
  {
    provide: 'PROJECT_PRODUCTS_REPOSITORY',
    useValue: ProjectProducts,
  },
  {
    provide: 'PROJECT_LABELS_REPOSITORY',
    useValue: ProjectLabels,
  },
  {
    provide: 'PROJECT_EVENTS_REPOSITORY',
    useValue: ProjectEvents,
  },
  {
    provide: 'PROJECT_COST_ESTIMATES_REPOSITORY',
    useValue: ProjectCostEstimates,
  },
  {
    provide: 'PROJECT_ADDITIONAL_COSTS_REPOSITORY',
    useValue: ProjectAdditionalCosts,
  },
  {
    provide: 'PROJECT_COMMENTS_REPOSITORY',
    useValue: ProjectComment,
  },
];
