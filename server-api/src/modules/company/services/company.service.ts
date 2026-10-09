import { Op, Sequelize } from 'sequelize';
import CompanyShare from 'src/database/models/companies-shares.model';
import Company from 'src/database/models/companies.model';
import { BadRequestError, NotFoundError, randString, removeNullFields } from 'src/shared/utils';
import DateFormatter from 'src/shared/utils/date-utils';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CompanyService {
  constructor(
    @Inject('COMPANY_REPOSITORY')
    private readonly companyRepository: typeof Company,
    @Inject('COMPANY_SHARE_REPOSITORY')
    private readonly companyShareRepository: typeof CompanyShare,
  ) {}

  async selectCompany(companyId: number): Promise<Company> {
    const company = await Company.findOne({ where: { id: companyId, deleted_at: null } });
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return removeNullFields(DateFormatter.formatDTO(company.dataValues)) as Company;
  }

  async selectCompaniesByIds(ids: number[]): Promise<Company[]> {
    const companies = await Company.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
        deleted_at: null,
      },
    });

    return companies;
  }

  async selectCompanyFromSignature(signature: string): Promise<Company> {
    const company = await Company.findOne({ where: { signature: signature, deleted_at: null } });
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return DateFormatter.formatDTO(company);
  }

  async selectShares(companyId: number): Promise<CompanyShare[]> {
    const shares = await CompanyShare.findAll({
      include: [
        {
          model: Company,
          as: 'company',
          required: true, // Ensures an INNER JOIN
          on: Sequelize.where(Sequelize.col('company.signature'), '=', Sequelize.col('CompanyShare.signature')),
        },
      ],
      where: {
        company_id: companyId,
      },
    });

    if (!shares) {
      throw new NotFoundError('Shares not found');
    }

    return shares;
  }

  async newSignature(companyId: number): Promise<string> {
    const newSign = randString(16);
    const [affectedCount] = await this.companyRepository.update(
      { signature: newSign },
      { where: { id: companyId }, silent: true },
    );

    if (affectedCount === 0) {
      throw new NotFoundError('Company not found');
    }

    return newSign;
  }

  async connectCompany(companyId: number, signature: string): Promise<CompanyShare> {
    const company = await this.selectCompanyFromSignature(signature);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const [newComShare] = await this.companyShareRepository.findOrCreate({
      where: { company_id: companyId, signature },
      defaults: {
        signature,
        company_id: companyId,
        type: 'company',
        created_at: new Date(),
      },
    });
    if (!newComShare) {
      throw new NotFoundError('Company share not found');
    }

    return newComShare;
  }

  async removeCompany(companyId: number, signature: string): Promise<void> {
    const company = await this.selectCompany(companyId);
    if (company.signature === signature) {
      throw new BadRequestError('cannot remove your company');
    }

    await this.companyShareRepository.destroy({
      where: { company_id: companyId, signature },
    });
  }
}
