import * as fs from 'fs';
import parsePhoneNumberFromString from 'libphonenumber-js';
import * as path from 'path';
import { findCustomerByBasic } from 'src/database/models';
import Contact from 'src/database/models/contacts.model';
import Customer from 'src/database/models/customers.model';
import { BadRequestError, NotFoundError } from 'src/shared/utils';
import DateFormatter from 'src/shared/utils/date-utils';
import * as ExcelJS from 'exceljs';
import { Inject, Injectable } from '@nestjs/common';
import {
  ContactInputDto,
  ContactResponseDto,
  CustomerContactsInputDto,
  CustomerDto,
  CustomerEntityDto,
  CustomerInputDto,
  ListCustomersRequestDto,
} from '../dto';
import { ConfigService } from '@nestjs/config';
import { Op, Sequelize } from 'sequelize';

@Injectable()
export class CustomerService {
  private readonly UPLOAD_PATH: string;

  constructor(
    @Inject('CUSTOMER_REPOSITORY')
    private readonly customerRepository: typeof Customer,
    @Inject('CONTACT_REPOSITORY')
    private readonly contactRepository: typeof Contact,
    private readonly configService: ConfigService,
  ) {
    this.UPLOAD_PATH = this.configService.get<string>('UPLOAD_PATH');
  }

  async selectCustomers(companyId: number): Promise<CustomerDto[]> {
    const customers = await Customer.findAll({
      where: { company_id: companyId, deleted_at: null },
      order: [['id', 'ASC']],
    });

    const result: CustomerDto[] = customers.map((customer) => {
      const { name, ...rest } = customer.get({ plain: true });

      return {
        ...rest,
        company: name,
        name: name,
        details: rest.metadata,
      };
    });

    return DateFormatter.formatDTO(result);
  }

  async selectCustomer(companyId: number, customerId: number): Promise<CustomerEntityDto> {
    const customer = await Customer.findOne({
      where: { id: customerId, company_id: companyId, deleted_at: null },
      raw: true,
    });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return DateFormatter.formatDTO(customer);
  }

  async selectCustomerWithContacts(companyId: number, customerId: number): Promise<CustomerContactsInputDto> {
    const customer = (await Customer.findOne({
      where: {
        id: customerId,
        company_id: companyId,
      },
      include: [
        {
          model: Contact,
          as: 'contacts',
          required: false, // Allows a LEFT JOIN behavior
        },
      ],
    })) as CustomerContactsInputDto;
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  async selectContact(companyId: number, customerId: number, contactId: number): Promise<ContactResponseDto> {
    const contact = await Contact.findOne({
      where: {
        id: contactId,
        company_id: companyId,
        customer_id: customerId,
      },
      raw: true,
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    return DateFormatter.formatDTO(contact);
  }

  async insertContact(companyId: number, customerId: number, contact: ContactInputDto): Promise<ContactResponseDto> {
    const customer = await this.customerRepository.findByPk(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const [parsePhone, parseMobile] = [
      parsePhoneNumberFromString(contact.phone, 'CH'),
      parsePhoneNumberFromString(contact.mobile, 'CH'),
    ];
    if (!parsePhone) {
      throw new BadRequestError('invalid phone number');
    }
    if (!parseMobile) {
      throw new BadRequestError('invalid mobile phone number');
    }

    contact.phone = parsePhone.formatInternational();
    contact.mobile = parseMobile.formatInternational();

    const newContact = await this.contactRepository.create({
      metadata: { ...contact },
      company_id: companyId,
      customer_id: customerId,
      created_at: new Date(),
    });
    if (!newContact) {
      throw new BadRequestError('Contact not created');
    }

    return DateFormatter.formatDTO(newContact);
  }

  async updateContact(
    companyId: number,
    customerId: number,
    contactId: number,
    contact: ContactInputDto,
  ): Promise<void> {
    const customer = await this.customerRepository.findByPk(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const getContact = await this.selectContact(companyId, customerId, contactId);
    if (!getContact) {
      throw new NotFoundError('Contact not found');
    }

    const [parsePhone, parseMobile] = [
      parsePhoneNumberFromString(contact.phone, 'CH'),
      parsePhoneNumberFromString(contact.mobile, 'CH'),
    ];
    if (!parsePhone) {
      throw new BadRequestError('invalid phone number');
    }
    if (!parseMobile) {
      throw new BadRequestError('invalid mobile phone number');
    }

    contact.phone = parsePhone.formatInternational();
    contact.mobile = parseMobile.formatInternational();

    const [affectedCount] = await this.contactRepository.update(
      { metadata: { ...contact }, updated_at: new Date() },
      { where: { id: contactId, company_id: companyId } },
    );
    if (affectedCount === 0) {
      throw new BadRequestError('Contact not updated');
    }
  }

  async deleteContact(companyId: number, customerId: number, contactId: number): Promise<void> {
    await this.contactRepository.update(
      { deleted_at: new Date() },
      { where: { id: contactId, company_id: companyId, customer_id: customerId } },
    );
  }

  async insertCustomer(companyId: number, customer: CustomerInputDto): Promise<void> {
    const { category, type, company, ...rest } = customer;

    if (rest.phone) {
      const parsePhone = parsePhoneNumberFromString(rest.phone, 'CH');

      if (parsePhone) {
        rest.phone = parsePhone.formatInternational();
      }
    }

    const newCustomer = await this.customerRepository.create({
      metadata: { ...rest },
      name: company,
      category: category ? category : 'customer',
      type: type ? type : 'company',
      company_id: companyId,
      created_at: new Date(),
    });

    if (!newCustomer) {
      throw new BadRequestError('Customer not created');
    }
  }

  async updateCustomer(companyId: number, customerId: number, customer: CustomerInputDto): Promise<void> {
    const getCus = await this.selectCustomer(companyId, customerId);

    // eslint-disable-next-line prefer-const
    let { category, type, company, ...rest } = customer;

    if (rest.phone) {
      const parsePhone = parsePhoneNumberFromString(rest.phone, 'CH');

      if (parsePhone) {
        rest.phone = parsePhone.formatInternational();
      }
    }

    category = category ? category : getCus.category;
    type = type ? type : getCus.type;
    company = company ? company : getCus.name;

    const [affectedCount] = await this.customerRepository.update(
      { metadata: { ...rest }, name: company, category, type, updated_at: new Date() },
      { where: { id: customerId, company_id: companyId } },
    );

    if (affectedCount === 0) {
      throw new BadRequestError('Customer not updated');
    }
  }

  async importFromExcel(file: Express.Multer.File): Promise<CustomerContactsInputDto[]> {
    const data = file.buffer;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data);
    const customers: CustomerContactsInputDto[] = [];

    workbook.eachSheet((worksheet) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: any[][] = [];

      // Read all rows into the rows array
      worksheet.eachRow((row) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.push(row.values as any);
      });

      // Process rows, skipping header rows (assuming the first row is the header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        // Check for Firma or Privatperson in the first column
        if (row[1] === 'Firma' || row[1] === 'Privatperson') {
          const cus = new CustomerContactsInputDto({
            company_id: 1,
            type: row[1],
            category: row[2],
            first_name: row[3],
            last_name: row[4],
            name: row[5],
            created_at: new Date(),
            metadata: {
              comment: `Anrede: ${row[6]}`,
              address: row[7],
              otherAddress: row[8],
              postcode: row[9],
              place: row[10],
              country: row[11],
              phone: row[12],
              fax: row[13],
              email: row[14],
              web: row[15],
            },
          });

          if (row[17] || row[18]) {
            const contact = new Contact({
              metadata: {
                title_input: row[16],
                name: row[17],
                given_name: row[18],
                comment: `Kontact Anrede: ${row[19]}`,
                email: row[20],
                private_mail: row[21],
                phone: row[22],
                mobile: row[23],
              },
            });

            // Find if customer already exists
            const [indexFounded, found] = findCustomerByBasic(
              customers,
              cus.name,
              cus.first_name,
              cus.last_name,
              cus.type,
              cus.category,
              cus.metadata.address,
              cus.metadata.postcode,
              cus.metadata.place,
              cus.metadata.country,
            );

            if (found) {
              customers[indexFounded].contacts.push(contact);
            } else {
              cus.contacts = [contact];
              customers.push(cus);
            }
          } else {
            customers.push(cus);
          }
        }
      }
    });

    // Bulk create in the repository with the contacts included
    await this.customerRepository.bulkCreate(customers, { include: [Contact] });
    return customers;
  }

  async importFromVCF(companyId: number, fileName: string): Promise<void> {
    // Read the VCF file
    const filePath = path.join(this.UPLOAD_PATH, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Process the VCF content
    const lines = fileContent.split('\n');
    const data: Record<string, string> = {};
    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) {
        data[key.trim()] = value.trim();
      }
    }

    const name = data['N;CHARSET=UTF-8']?.split(';') ?? [];
    const address = data['ADR;CHARSET=UTF-8;TYPE=WORK']?.split(';') ?? [];

    // Extract phone numbers
    let cellPhone = '';
    let workPhone = '';
    const phoneKey = Object.keys(data).find((key) => key.includes('TEL;TYPE=') && key.includes('VOICE'));
    if (phoneKey) {
      const phones = data[phoneKey];
      const parsedPhone = parsePhoneNumberFromString(phones, 'CH');

      if (parsedPhone) {
        const formattedPhone = parsedPhone.formatInternational();
        if (phoneKey.includes('CELL')) {
          cellPhone = formattedPhone;
        } else if (phoneKey.includes('WORK')) {
          workPhone = formattedPhone;
        }
      }
    }

    await this.customerRepository.create({
      company_id: companyId,
      name: name.length > 0 ? name.join(' ') : '',
      first_name: name[1] ? name[1] : data['FN;CHARSET=UTF-8'],
      last_name: name[0] ? name[0] : null,
      category: data['ROLE;CHARSET=UTF-8'] || 'customer',
      type: name[3] ? 'person' : 'company',
      metadata: {
        web: data['URL;CHARSET=UTF-8'] || '',
        country: address[6] || '',
        email: data['EMAIL;CHARSET=UTF-8;type=HOME,INTERNET'] || '',
        address: address[2] || '',
        place: address[3] || '',
        postcode: address[5] || '',
        phone: workPhone,
        cell_phone: cellPhone,
        title: 'mr',
        comment: data['NOTE;CHARSET=UTF-8'] || '',
      },
      created_at: new Date(),
    });
  }

  async deleteCustomer(userId: number, companyId: number, customerId: number): Promise<void> {
    await this.selectCustomer(companyId, customerId);

    await this.customerRepository.update(
      { deleted_at: new Date(), deleted_by: userId },
      { where: { id: customerId, company_id: companyId } },
    );
  }

  async listCustomers(
    companyId: number,
    filter: ListCustomersRequestDto,
  ): Promise<{
    items: CustomerDto[];
    total: number;
    page: number | null;
    pageSize: number | null;
  }> {
    const { page, page_size, search, category, type, sort } = filter; // Build where clause
    const whereClause: Record<string, unknown> = {
      company_id: companyId,
      deleted_at: null,
    };

    // Add category filter
    if (category) {
      whereClause.category = category;
    }

    // Add type filter
    if (type) {
      whereClause.type = type;
    } // Add search filter
    if (search) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (whereClause as any)[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        Sequelize.where(Sequelize.cast(Sequelize.col('metadata'), 'text'), { [Op.iLike]: `%${search}%` }),
      ];
    }

    // Build order clause
    let orderClause: [string, string][] = [['id', 'ASC']];
    if (sort) {
      const [field, direction] = sort.split(':');
      const validFields = ['name', 'first_name', 'last_name', 'category', 'type', 'created_at', 'updated_at'];
      const validDirections = ['asc', 'desc'];

      if (validFields.includes(field) && validDirections.includes(direction?.toLowerCase())) {
        orderClause = [[field, direction.toUpperCase()]];
      }
    }

    // Build pagination
    const limit = page_size ? parseInt(page_size.toString()) : 20;
    const offset = page ? (parseInt(page.toString()) - 1) * limit : 0;

    // Execute query
    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit,
      offset,
      distinct: true,
    });

    // Format results
    const items: CustomerDto[] = rows.map((customer) => {
      const { name, ...rest } = customer.get({ plain: true });
      return {
        ...rest,
        company: name,
        name: name,
        details: rest.metadata,
      };
    });

    return {
      items: DateFormatter.formatDTO(items),
      total: count,
      page: page ? parseInt(page.toString()) : null,
      pageSize: limit,
    };
  }
}
