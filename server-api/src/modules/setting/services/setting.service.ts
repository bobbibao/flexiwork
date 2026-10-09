import { parsePhoneNumberFromString } from 'libphonenumber-js';
import Company from 'src/database/models/companies.model';
import Setting, { TabOfSettings, TaskState } from 'src/database/models/setting.model';
import { BadRequestError, removeDuplicateArrayObjectByKeys, saveUploadFile } from 'src/shared/utils';
import DateFormatter from 'src/shared/utils/date-utils';
import { Inject, Injectable } from '@nestjs/common';
import { HolidayDto } from '../dto/holiday.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SettingService {
  private readonly UPLOADS_API_PATH: string;

  constructor(
    @Inject('SETTING_REPOSITORY')
    private readonly settingRepository: typeof Setting,
    private readonly configService: ConfigService,
  ) {
    this.UPLOADS_API_PATH = this.configService.get<string>('UPLOADS_API_PATH', 'api/uploads');
  }

  // Method to select settings by company ID
  async selectSetting(companyId: number): Promise<Setting> {
    const setting = await Setting.findOne({ where: { company_id: companyId }, raw: true });

    if (!setting) {
      throw new BadRequestError(`Setting not found for company_id: ${companyId}`);
    }

    return DateFormatter.formatDTO(setting);
  }

  // Get the setting value based on the module and key
  async getSettingValue<T = HolidayDto[]>(companyId: number, module: string, key: string = ''): Promise<T> {
    const setting = await this.selectSetting(companyId);

    let value: T;

    switch (module) {
      case 'timesheet':
        if (setting.timesheet && typeof setting.timesheet === 'object' && key in setting.timesheet && key !== '') {
          value = setting.timesheet[key];
        } else {
          throw new BadRequestError(`Key "${key}" not found in module "${module}"`);
        }
        break;

      case 'offer':
        if (setting.offer && typeof setting.offer === 'object' && key in setting.offer && key !== '') {
          value = setting.offer[key];
        } else {
          throw new BadRequestError(`Key "${key}" not found in module "${module}"`);
        }
        break;

      // Add cases for other modules like 'project', 'invoice', etc.
      case 'project':
        if (setting.project && typeof setting.project === 'object' && key in setting.project && key !== '') {
          value = setting.project[key];
        } else {
          throw new BadRequestError(`Key "${key}" not found in module "${module}"`);
        }
        break;

      case 'task':
        if (setting.task) {
          if (key === 'priorities') {
            value = setting.task.priorities as T;
          } else if (key === 'statuses') {
            value = setting.task.statuses as T;
          } else {
            value = setting.task as T;
          }
        } else {
          throw new BadRequestError(`Key "${key}" not found in module "${module}"`);
        }
        break;

      default:
        throw new BadRequestError(`Module "${module}" is not supported`);
    }

    return value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateSetting(companyId: number, tab: TabOfSettings, data: Record<string, any>): Promise<Setting> {
    const setting = await this.settingRepository.findOne({
      where: {
        company_id: companyId,
      },
    });
    if (!setting) {
      throw new BadRequestError('Company setting not found');
    }

    switch (tab) {
      case 'masterdata':
        if (data.phone) {
          // Format phone number using libphonenumber-js
          const parsedPhone = parsePhoneNumberFromString(data.phone, 'CH');
          if (parsedPhone) {
            data.phone = parsedPhone.formatInternational();
          }
        }

        if (data.company) {
          // Update company name
          const company = await Company.findOne({ where: { id: companyId } });
          if (company) {
            company.name = data.company;
            await company.save();
          }
        }
        setting.master_data = data; // Assuming masterData is a field in the setting model
        break;

      case 'offer':
        setting.offer = data;
        break;

      case 'project':
        setting.project = data;
        break;

      case 'invoice':
        setting.invoice = data;
        break;

      case 'pdflayout':
        setting.pdf_layout = data;

        // Handle to save logo
        if (data.logo) {
          const { logo } = data;
          const dateTime = (new Date().getTime() / 1000).toFixed(0);
          const savedAvatar = saveUploadFile(logo, `${companyId}-${dateTime}`);

          Object.assign(data, { logo: `${this.UPLOADS_API_PATH}/${savedAvatar}` });
        }

        break;

      case 'timesheet':
        setting.timesheet = data;
        break;

      case 'product':
        setting.product = data;
        break;

      case 'task': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isValidTaskState = (obj: any): obj is TaskState => {
          return obj && typeof obj.label === 'string' && typeof obj.color === 'string';
        };

        const validPriorities = data.priorities?.filter(isValidTaskState) || [];
        const validStatuses = data.statuses?.filter(isValidTaskState) || [];

        const taskPriorities: TaskState[] = removeDuplicateArrayObjectByKeys<TaskState>(validPriorities, [
          'label',
          'color',
        ]);
        const taskStatuses: TaskState[] = removeDuplicateArrayObjectByKeys<TaskState>(validStatuses, [
          'label',
          'color',
        ]);

        setting.task = {
          priorities: taskPriorities.map((p, index) => ({ ...p, id: index })),
          statuses: taskStatuses.map((s, index) => ({ ...s, id: index })),
        };
        break;
      }

      default:
        throw new BadRequestError(`Tab "${tab}" is not supported`);
    }

    return await setting.save();
  }
}
