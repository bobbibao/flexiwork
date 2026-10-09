import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import Config from 'src/database/models/config.model';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) 
    private readonly cacheManager: Cache
  ) {}

  async getVersion(): Promise<string> {
    const key = 'VERSION';
    let value = await this.cacheManager.get<string>(key);

    if (!value) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { version } = require('../../../package.json');

      if (version) {
        value = version;
        await this.cacheManager.set(key, value, 60 * 60 * 2 * 1000); // Cache for 60 seconds*60 mins*2 hours
      }
    }

    return value;
  }

  async getConfigValue(key: string): Promise<string> {
    let value = await this.cacheManager.get<string>(key);

    if (!value) {
      const config = await Config.findOne({ where: { ConfigKey: key } });

      if (config) {
        value = config.ConfigValue;
        await this.cacheManager.set(key, value, 60 * 60 * 2 * 1000); // Cache for 60 seconds*60 mins*2 hours
      }
    }

    return value;
  }
  //   async getAccessControl(): Promise<AccessControl[]> {
  //     let accessControl: AccessControl[] = await this.cacheManager.get<AccessControl[]>('ACCESS_CONTROL');
  //     if (!accessControl) {
  //       accessControl = await AccessControl.findAll({});
  //       if (accessControl) {
  //         await this.cacheManager.set('ACCESS_CONTROL', accessControl, 60 * 60 * 3 * 1000); // Cache for 60 seconds*60 mins*3 hours
  //       }
  //     }
  //     return accessControl;
  //   }

  //   async getFileTypes(): Promise<FileType[]> {
  //     let fileTypes: FileType[] = await this.cacheManager.get<FileType[]>('FILE_TYPES');
  //     if (!fileTypes) {
  //       fileTypes = await FileType.findAll<FileType>({
  //         order: [['Name', 'ASC']],
  //       });
  //       if (fileTypes) {
  //         await this.cacheManager.set('FILE_TYPES', fileTypes, 60 * 60 * 3 * 1000);
  //       }
  //     }
  //     return fileTypes;
  //   }
  async updateConfigValue(key: string, value: string): Promise<void> {
    if (key && value) {
      await Config.update(
        {
          ConfigValue: value,
        },
        {
          where: {
            ConfigKey: key,
          },
        },
      );
    }
  }
}
