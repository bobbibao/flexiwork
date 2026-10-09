import { isNumberString } from 'class-validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Op } from 'sequelize';
import Company from 'src/database/models/companies.model';
import GroupProduct from 'src/database/models/group-products.model';
import CompanyGroup from 'src/database/models/company-groups.model';
import Product from 'src/database/models/products.model';
import Setting from 'src/database/models/setting.model';
import Unit from 'src/database/models/units.model';
import UserActivation from 'src/database/models/user-activations.model';
import User from 'src/database/models/users.model';
import VatRate from 'src/database/models/vat-rates.model';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { CodeEnum, Currency, Language, RoleEnum } from 'src/shared/enums';
import { MailTemplates, SendMailService } from 'src/shared/services';
import {
  BadRequestError,
  ForbiddenError,
  formatStringToDate,
  InternalServerError,
  NotFoundError,
  randString,
  saveUploadFile,
  UnauthorizedError,
} from 'src/shared/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compareSync, hashSync } from '@node-rs/bcrypt';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_UNITS,
  DEFAULT_VAT_RATES,
  defaultInvoice,
  defaultMasterData,
  defaultOffer,
  defaultPDFLayout,
  defaultProject,
  defaultTaskStates,
  defaultTimesheet,
} from '../constants';
import {
  AuthResponseDto,
  ChangePasswordDto,
  CreateUserDto,
  EditUserDto,
  ForgotPasswordDto,
  LoginUserDto,
  MultipleAccountResponseDto,
  RegisterUserDto,
  ResetPasswordDto,
  ToggleUserStatusDto,
  UpdateTimeSheetPeriodDto,
  VerifyRegisterDto,
} from '../dto';
import { WorkItemService } from 'src/modules/work-item/services/work-item.service';
import { TimeSheetPeriodsEntityDto } from 'src/modules/work-item/dto';
import WorkLog from 'src/database/models/work-logs.model';
import { DEFAULT_ARCHITECTURE_GROUP_NAME } from 'src/shared/constants/company-group-defaults.constant';

interface ListUser {
  users: User[];
  count: number;
}

interface MultipleAccountsError {
  users: User[];
  error: string;
}

@Injectable()
export class UsersService {
  private readonly BCRYPT_HASH_COST = 10;
  private readonly UPLOADS_API_PATH: string;
  private readonly FRONTEND_URL: string;

  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: typeof User,
    @Inject('USER_ACTIVATION_REPOSITORY')
    private readonly userActivationRepository: typeof UserActivation,
    @Inject('COMPANY_REPOSITORY')
    private readonly companyRepository: typeof Company,
    @Inject('VAT_RATE_REPOSITORY')
    private readonly vatRateRepository: typeof VatRate,
    @Inject('UNIT_REPOSITORY')
    private readonly unitRepository: typeof Unit,
    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepository: typeof Product,
    @Inject('COMPANY_GROUP_REPOSITORY')
    private readonly companyGroupRepository: typeof CompanyGroup,
    @Inject('GROUP_PRODUCT_REPOSITORY')
    private readonly groupProductRepository: typeof GroupProduct,
    @Inject('SETTING_REPOSITORY')
    private readonly settingRepository: typeof Setting,
    @Inject('WORK_LOG_REPOSITORY')
    private readonly workLogRepository: typeof WorkLog,
    private readonly authService: AuthService,
    private readonly sendMailService: SendMailService,
    private readonly configService: ConfigService,
    private readonly workItemService: WorkItemService,
  ) {
    this.UPLOADS_API_PATH = this.configService.get<string>('UPLOADS_API_PATH', 'api/uploads');
    this.FRONTEND_URL = this.configService.get<string>('FRONTEND_URL', 'frontend_url');
  }

  async findAllUser(companyId: number): Promise<ListUser> {
    const { rows: users, count } = await this.userRepository.findAndCountAll({
      where: {
        is_active: true,
        company_id: companyId,
        deleted_at: null,
      },
      attributes: {
        exclude: ['password', 'metadata', 'nickname', 'deleted_at'],
      },
      order: [
        ['is_active', 'ASC'],
        ['role', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    return {
      users: users,
      count,
    };
  }

  async getSimpleActiveUsers(currentUser: User): Promise<ListUser> {
    const { rows: users, count } = await this.userRepository.findAndCountAll({
      where: {
        company_id: currentUser.company_id,
        is_active: true,
        deleted_at: null,
      },
      attributes: ['id', 'email', 'avatar_url', 'name', 'first_name', 'last_name'],
      order: [['created_at', 'ASC']],
    });

    return {
      users,
      count,
    };
  }

  async findUserById(currentUser: User, id: string): Promise<User> {
    // Parse id & find user
    let idInNumber = isNumberString(id) ? parseInt(id) : 0;

    if (idInNumber < 0) {
      idInNumber = 0;
    }

    const existingUser = await this.userRepository.findOne({
      where: {
        id: idInNumber,
        company_id: currentUser.company_id,
      },
      attributes: {
        exclude: ['password', 'metadata', 'nickname', 'deleted_at'],
      },
    });
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const user = await this.userRepository.findOne({
      attributes: ['timesheet_periods'],
      where: { id: idInNumber },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const timesheetPeriods: TimeSheetPeriodsEntityDto[] = await this.workItemService.getTimesheetPeriods(idInNumber);

    const result = timesheetPeriods
      .map((period, index, array) => {
        const startDate = new Date(period.start_date);
        const endDate = index < array.length - 1 ? new Date(array[index + 1].start_date) : null;
        return {
          start_date: startDate,
          end_date: endDate,
          work_percent: period.work_percent,
          actual_hours_per_day: period.actual_hours_per_day,
          latest_flex_hours: period.latest_flex_hours,
        };
      })
      .sort((a, b) => a.start_date.getTime() - b.start_date.getTime());

    existingUser.max_work_hours_per_day = result.length > 0 ? result[result.length - 1].actual_hours_per_day : 0;
    existingUser.max_work_hours_per_week = Number(existingUser.max_work_hours_per_week) || 0;

    return existingUser;
  }

  async login(loginUserDto: LoginUserDto): Promise<AuthResponseDto | MultipleAccountResponseDto> {
    const { email, password, company_id: companyId = 0 } = loginUserDto;

    const existingUser = await this.findOneByEmail(email, companyId);

    // Return error if multiple accounts was found
    if (!(existingUser instanceof User)) {
      const whereCompanyIds = existingUser.users.map((user) => ({ id: user.company_id }));
      const companies = await this.companyRepository.findAll({
        where: {
          [Op.or]: whereCompanyIds,
        },
        attributes: ['id', 'name'],
      });
      return {
        error: existingUser.error,
        companies: companies,
      };
    }

    if (!existingUser.password) {
      throw new ForbiddenError('Verify register before login');
    }

    if (!compareSync(password, existingUser.password)) {
      throw new BadRequestError('Not registered email or invalid password');
    }

    // Generate token
    const accessToken = this.authService.generateToken(existingUser);

    return {
      access_token: accessToken,
      user: existingUser,
    };
  }

  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const {
      email,
      currency,
      language,
      company,
      accept_term: acceptTerm,
      architecture_template: architectureTemplate,
    } = registerUserDto;

    // Validate inputs
    if (!acceptTerm) {
      throw new UnauthorizedError('Please accept the terms and conditions for the use of ArchApp');
    }
    if (architectureTemplate && (language.toLowerCase() !== Language.DE || currency.toUpperCase() !== Currency.CHF)) {
      throw new BadRequestError('Architecture template supports in DE/CHF only');
    }

    // Start transaction
    const transaction = await this.userRepository.sequelize.transaction();

    try {
      // Create new company
      const savedCompany = await this.companyRepository.create(
        {
          name: company,
          language: language.toLowerCase(),
          currency: currency.toUpperCase(),
          created_at: new Date(),
        },
        { transaction },
      );

      // Create new user
      const savedUser = await this.userRepository.create(
        {
          company_id: savedCompany.id,
          email,
          role: RoleEnum.ADMIN,
          is_active: true,
          created_at: new Date(),
        },
        { transaction },
      );

      // Create new default VAT Rates
      let defaultVatRate: VatRate;
      for (const vatRate of DEFAULT_VAT_RATES) {
        const savedVatRate = await this.vatRateRepository.create(
          {
            company_id: savedCompany.id,
            rate: vatRate.value,
            is_visible: true,
            is_default: vatRate.isDefault,
            created_at: new Date(),
          },
          { transaction },
        );

        if (vatRate.isDefault) {
          defaultVatRate = savedVatRate;
        }
      }

      // Create new default Units
      let defaultUnit: Unit;
      for (const unit of DEFAULT_UNITS) {
        const savedUnit = await this.unitRepository.create(
          {
            company_id: savedCompany.id,
            name: unit.name,
            description: unit.description,
            time_recording_active: unit.timeRecordActive,
            is_visible: unit.visible,
            is_default: unit.isDefault,
            created_at: new Date(),
          },
          { transaction },
        );

        if (unit.isDefault) {
          defaultUnit = savedUnit;
        }
      }

      if (architectureTemplate) {
        // Create new default products if architecture template is selected
        const saveProducts: Product[] = [];
        for (const product of DEFAULT_PRODUCTS) {
          const savedProduct = await this.productRepository.create(
            {
              company_id: savedCompany.id,
              name: product.name,
              description: product.description,
              price: product.price,
              vat_rate_id: defaultVatRate.id,
              unit_id: defaultUnit.id,
            },
            { transaction },
          );
          saveProducts.push(savedProduct);
        }

        // Create new default group
        const newGroupProduct = await this.companyGroupRepository.create(
          {
            company_id: savedCompany.id,
            name: DEFAULT_ARCHITECTURE_GROUP_NAME,
            description: `${DEFAULT_ARCHITECTURE_GROUP_NAME} SIA 102.`,
          },
          { transaction },
        );

        // Create new default group product
        for (const product of saveProducts) {
          await this.groupProductRepository.create(
            {
              group_id: newGroupProduct.id,
              product_id: product.id,
              amount: 1,
            },
            { transaction },
          );
        }
      }

      // Create new default setting
      await this.settingRepository.create(
        {
          company_id: savedCompany.id,
          created_at: new Date(),
          master_data: defaultMasterData(email),
          offer: defaultOffer,
          invoice: defaultInvoice,
          project: defaultProject,
          timesheet: defaultTimesheet,
          pdf_layout: defaultPDFLayout,
          task: defaultTaskStates,
        },
        { transaction },
      );

      // Generate activation code
      const code = await this.getActivationCode(12, CodeEnum.ActivationTypeRegister);
      await this.userActivationRepository.create(
        {
          user_id: savedUser.id,
          company_id: savedCompany.id,
          activation_code: code,
          created_at: new Date(),
          type: CodeEnum.ActivationTypeRegister,
        },
        { transaction },
      );

      await transaction.commit();

      // Send email with verify account link
      const sendMailResult = await this.sendMailService.sendMail(
        savedUser.email,
        'ARCHAPP | Aktivierung Ihres Accounts!',
        MailTemplates.REGISTRATION,
        {
          url: `${this.FRONTEND_URL}/#/verify-register/${code}`,
        },
      );

      if (!sendMailResult) {
        throw new InternalServerError('Failed to send email!');
      }

      return savedUser;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof InternalServerError) {
        throw error;
      }
      throw new BadRequestError('Failed to register user');
    }
  }

  async verifyRegister(verifyRegisterDto: VerifyRegisterDto, code: string): Promise<User> {
    const { password, confirm_password: confirmPassword } = verifyRegisterDto;

    // Validate inputs
    if (password !== confirmPassword) {
      throw new UnauthorizedError('Password and confirm must be the same');
    }

    // Check code is valid
    const existingUserActivation = await this.userActivationRepository.findOne({
      where: {
        activation_code: code,
        deleted_at: null,
        [Op.or]: [{ type: CodeEnum.ActivationTypeRegister }, { type: CodeEnum.ActivationTypeCreate }],
      },
    });
    if (!existingUserActivation) {
      throw new UnauthorizedError('Invalid activation code');
    }

    const existingUser = await this.userRepository.findOne({
      where: {
        id: existingUserActivation.user_id,
        deleted_at: null,
      },
    });
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Start transaction
    const transaction = await this.userRepository.sequelize.transaction();

    try {
      // Update user
      existingUser.is_active = true;
      existingUser.password = hashSync(password, this.BCRYPT_HASH_COST);
      await existingUser.save({ transaction });

      // Mark as user activation is deleted
      existingUserActivation.deleted_at = new Date();
      await existingUserActivation.save({ transaction });

      await transaction.commit();
      return existingUser;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createUser(currentUser: User, createUserDto: CreateUserDto): Promise<User> {
    const {
      max_work_hours_per_day: maxWorkHoursPerDay,
      role,
      work_percent_per_week: workPercentPerWeek,
      phone,
      email,
    } = createUserDto;

    // Validate inputs
    // FIXME: The validation for maxWorkHoursPerDay is commented out because the frontend does not currently update this value.
    // if (maxWorkHoursPerDay <= 0) {
    //   throw new UnauthorizedError('Max work hours per day must be larger than 0');
    // }
    if (role === 'project manager') {
      createUserDto.role = RoleEnum.MANAGER;
    }
    if (role !== RoleEnum.ADMIN && role !== RoleEnum.MANAGER && role !== RoleEnum.EMPLOYEE) {
      throw new BadRequestError('Invalid role');
    }
    // validate if email is exist
    const isEmailExisting = await this.userRepository.findOne({
      where: {
        email,
        company_id: currentUser.company_id,
        is_active: {
          [Op.is]: true,
        },
      },
    });
    if (isEmailExisting) {
      throw new UnauthorizedError('This email is existed in our system');
    }

    const companyId = currentUser.company_id;
    const maxWorkHoursPerWeek = maxWorkHoursPerDay * this.getWorkDays(workPercentPerWeek);
    let handledPhone = phone;

    // Format phone number. If it is not valid, keep the original phone number
    if (handledPhone && !!parsePhoneNumberFromString(handledPhone, 'CH')) {
      handledPhone = parsePhoneNumberFromString(handledPhone, 'CH').formatInternational();
    }

    // Start a transaction
    const transaction = await this.userRepository.sequelize.transaction();

    try {
      // Create user
      const savedUser = await this.userRepository.create(
        {
          ...createUserDto,
          work_percent_per_week: createUserDto.work_percent_per_week.toString(),
          company_id: companyId,
          created_at: new Date(),
          is_active: true,
          max_work_hours_per_week: maxWorkHoursPerWeek,
          holiday_periods: JSON.stringify(createUserDto.holiday_periods),
          phone: handledPhone,
        },
        { transaction },
      );

      // Create user activation
      const code = await this.getActivationCode(12, CodeEnum.ActivationTypeRegister);
      await this.userActivationRepository.create(
        {
          user_id: savedUser.id,
          company_id: currentUser.company_id,
          activation_code: code,
          created_at: new Date(),
          type: CodeEnum.ActivationTypeCreate,
        },
        { transaction },
      );

      // Send email with verify account link
      const sendMailResult = await this.sendMailService.sendMail(
        savedUser.email,
        'ARCHAPP | Aktivierung Ihres Accounts!',
        MailTemplates.REGISTRATION,
        {
          url: `${this.FRONTEND_URL}/#/verify-register/${code}`,
        },
      );

      if (!sendMailResult) {
        throw new UnauthorizedError('Failed to send email!');
      }

      await transaction.commit();

      return savedUser;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async changePassword(currentUser: User, changePasswordDto: ChangePasswordDto): Promise<boolean> {
    const {
      current_password: currentPassword,
      password: newPassword,
      confirm_password: confirmPassword,
    } = changePasswordDto;

    // Validate inputs
    if (currentPassword === newPassword) {
      throw new UnauthorizedError('Old and new password cannot be the same');
    }
    if (newPassword !== confirmPassword) {
      throw new UnauthorizedError('Password and confirm must be the same');
    }

    // Get user
    const existingUser = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }
    if (!compareSync(currentPassword, existingUser.password)) {
      throw new UnauthorizedError('Invalid current password');
    }

    // Change password
    const newHashedPassword = hashSync(newPassword, this.BCRYPT_HASH_COST);
    existingUser.password = newHashedPassword;
    await existingUser.save();

    return true;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<boolean | MultipleAccountResponseDto> {
    const { email, company_id: companyId = 0 } = forgotPasswordDto;

    const existingUser = await this.findOneByEmail(email, companyId);

    // Return error if multiple accounts was found
    if (!(existingUser instanceof User)) {
      const whereCompanyIds = existingUser.users.map((user) => ({ id: user.company_id }));
      const companies = await this.companyRepository.findAll({
        where: {
          [Op.or]: whereCompanyIds,
        },
        attributes: ['id', 'name'],
      });
      return {
        error: existingUser.error,
        companies: companies,
      };
    }

    const existingForgotPasswordCode = await this.userActivationRepository.findOne({
      where: {
        user_id: existingUser.id,
        type: CodeEnum.ActivationTypeForgot,
        deleted_at: null,
      },
    });

    // Generate forgot password code
    const forgotPasswordCode = await this.getActivationCode(12, CodeEnum.ActivationTypeForgot);
    await this.userActivationRepository.create({
      user_id: existingUser.id,
      company_id: existingUser.company_id,
      activation_code: forgotPasswordCode,
      created_at: new Date(),
      type: CodeEnum.ActivationTypeForgot,
    });

    // Mark old forgot password as deleted
    if (existingForgotPasswordCode) {
      existingForgotPasswordCode.deleted_at = new Date();
      await existingForgotPasswordCode.save();
    }

    // Send email with reset pw link
    const sendMailResult = await this.sendMailService.sendMail(
      existingUser.email,
      'ARCHAPP | Resetting your account password!',
      MailTemplates.RESET_PASSWORD,
      {
        url: `${this.FRONTEND_URL}/#/forgot-password/${forgotPasswordCode}`,
      },
    );
    if (!sendMailResult) {
      throw new InternalServerError('Failed to send email!');
    }

    return true;
  }

  async resetPassword(code: string, resetPasswordDto: ResetPasswordDto): Promise<boolean> {
    const { password, confirm_password: confirmPassword } = resetPasswordDto;

    // Validate inputs
    if (password !== confirmPassword) {
      throw new UnauthorizedError('Password and confirm must be the same');
    }

    // Check forgot pw code is existing
    const existingUserActivation = await this.userActivationRepository.findOne({
      where: {
        activation_code: code,
        type: CodeEnum.ActivationTypeForgot,
        deleted_at: null,
      },
    });
    if (!existingUserActivation) {
      throw new NotFoundError('Code not found!');
    }

    // Reset pw
    const existingUser = await this.userRepository.findOne({
      where: {
        id: existingUserActivation.user_id,
      },
    });
    if (!existingUser) {
      throw new NotFoundError('User not found!');
    }
    const newHashedPassword = hashSync(password, this.BCRYPT_HASH_COST);
    existingUser.password = newHashedPassword;

    // Start transaction
    const transaction = await this.userRepository.sequelize.transaction();

    try {
      // Update user
      await existingUser.save({ transaction });

      // Delete forgot pw code
      existingUserActivation.deleted_at = new Date();
      await existingUserActivation.save({ transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateUser(userId: string, editUserDto: EditUserDto): Promise<User> {
    const { role } = editUserDto;

    // FIXME: The validation for maxWorkHoursPerDay is commented out because the frontend does not currently update this value.
    // if (maxWorkHoursPerDay <= 0) {
    //   throw new BadRequestError('Max work hours per day must be larger than 0');
    // }

    const existingUser = await this.findOneByIdString(userId);

    // Validate new role
    if (role) {
      if (role === 'project manager') {
        editUserDto.role = RoleEnum.MANAGER;
      } else if (!Object.values(RoleEnum).includes(role as RoleEnum)) {
        throw new BadRequestError('Invalid role');
      }
    }

    // Format phone number. If it is not valid, keep the original phone number
    if (editUserDto.phone && !!parsePhoneNumberFromString(editUserDto.phone, 'CH')) {
      editUserDto.phone = parsePhoneNumberFromString(editUserDto.phone, 'CH').formatInternational();
    }

    // Update user
    Object.assign(existingUser, editUserDto);
    existingUser.updatedAt = new Date();
    await existingUser.save();

    return existingUser;
  }

  async toggleUserStatus(userId: string, toggleUserStatusDto: ToggleUserStatusDto): Promise<User> {
    const { is_active: isActive } = toggleUserStatusDto;

    const existingUser = await this.findOneByIdString(userId);

    existingUser.is_active = isActive;
    existingUser.updatedAt = new Date();
    await existingUser.save();

    return existingUser;
  }

  async updateAvatar(userId: string, avatar: Express.Multer.File): Promise<User> {
    const existingUser = await this.findOneByIdString(userId);

    const dateTime = (new Date().getTime() / 1000).toFixed(0);
    const savedAvatar = saveUploadFile(avatar, `${existingUser.company_id}-avatar-${existingUser.id}-${dateTime}-`);
    const savedAvatarPath = `${this.UPLOADS_API_PATH}/${savedAvatar}`;

    existingUser.avatar_url = savedAvatarPath;
    existingUser.updated_at = new Date();
    await existingUser.save();

    return existingUser;
  }

  async updateUserTimeSheetPeriods(userId: string, timeSheetPeriods: UpdateTimeSheetPeriodDto[]): Promise<User> {
    const handledTimeSheetPeriods: UpdateTimeSheetPeriodDto[] = [];
    const existingUser = await this.findOneByIdString(userId);

    if (!Array.isArray(timeSheetPeriods)) {
      throw new BadRequestError('Invalid time sheet periods');
    }

    for (const timeSheetPeriod of timeSheetPeriods) {
      if (typeof timeSheetPeriod !== 'object') {
        throw new BadRequestError('Invalid time sheet period');
      }

      const { start_date: startDateInString, end_date: endDateInString } = timeSheetPeriod;

      // Format start date
      if (!startDateInString) {
        throw new BadRequestError('Missing start date!');
      }
      const startDate = formatStringToDate(startDateInString);
      const formattedStartDate = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`;

      // Format end date
      let endDate: Date;
      let formattedEndDate: string;
      if (!endDateInString) {
        // Get day end of this year
        const today = new Date();
        const year = today.getFullYear();
        endDate = new Date(year, 11, 31);
        formattedEndDate = `${year}-12-31`;
      } else {
        endDate = formatStringToDate(endDateInString);
        formattedEndDate = `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;
      }

      // Validate start & end date
      if (endDate.getTime() < startDate.getTime()) {
        throw new BadRequestError('End date cannot be before start date');
      }

      handledTimeSheetPeriods.push({
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        actual_hours_per_day: timeSheetPeriod.actual_hours_per_day,
        actual_planning_per_day: timeSheetPeriod.actual_planning_per_day,
        work_percent: timeSheetPeriod.work_percent,
        latest_flex_hours: timeSheetPeriod.latest_flex_hours,
        planning_percent: timeSheetPeriod.planning_percent,
      });
    }

    existingUser.timesheet_periods = handledTimeSheetPeriods;
    await existingUser.save();

    return existingUser;
  }

  async deleteUser(currentUser: User, userId: string): Promise<boolean> {
    const existingUser = await this.findOneByIdString(userId);

    if (existingUser.id === currentUser.id) {
      throw new BadRequestError('Cannot delete yourself');
    } else if (existingUser.company_id !== currentUser.company_id) {
      throw new BadRequestError('Cannot delete user from another company');
    }

    await existingUser.destroy();
    return true;
  }

  private async findOneByEmail(email: string, companyId: number = 0): Promise<User | MultipleAccountsError> {
    let existingUser: User;
    const existingUsers = await User.findAll({
      where: {
        email,
        deleted_at: null,
      },
    });
    if (existingUsers.length === 1) {
      existingUser = existingUsers[0];
    }
    if (existingUsers.length === 0) {
      throw new BadRequestError('Invalid user');
    }
    if (existingUsers.length > 1 && companyId <= 0) {
      return {
        users: existingUsers,
        error: 'Multiple accounts detected, please choose a company',
      };
      // throw new Error("Multiple accounts detected, please choose a company");
    }
    // Get user with company_id if multiple users are found
    if (existingUsers.length > 1 && companyId) {
      existingUser = existingUsers.find((user) => user.company_id === companyId);

      if (!existingUser) {
        throw new NotFoundError('User not found in provided company id');
      }
    }

    if (!existingUser.is_active) {
      throw new BadRequestError('This user is disabled');
    }

    return existingUser;
  }

  async findOneByIdString(id: string): Promise<User> {
    // Parse id & find user
    let userIdInNumber = isNumberString(id) ? parseInt(id) : 0;
    if (userIdInNumber < 0) {
      userIdInNumber = 0;
    }

    const existingUser = await this.userRepository.findOne({
      where: {
        id: userIdInNumber,
      },
    });
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    return existingUser;
  }

  private async getActivationCode(length: number, type: CodeEnum): Promise<string> {
    let code: string = '';

    for (;;) {
      code = randString(length);
      const existingCode = await this.userActivationRepository.findOne({
        where: {
          type,
          activation_code: code,
          deleted_at: null,
        },
      });

      if (!existingCode) {
        break;
      }
    }

    return code;
  }

  private getWorkDays(percent: number): number {
    if (Math.floor(percent) === 80) {
      return 4;
    }
    if (Math.floor(percent) === 60) {
      return 3;
    }

    return 5;
  }

  /**
   * Check yesterday time sheet is exist of current user. If current day is Monday, it will check Friday time sheet
   * @param currentUser - Current user
   * @returns boolean - Return true if yesterday time sheet is exist, otherwise return false
   */
  async checkYesterdayTimeSheet(currentUser: User): Promise<boolean> {
    const today = new Date();
    let minusDay = 1;

    // If today is Monday, check Friday time sheet by minus 3 days from today
    if (today.getDay() == 1) {
      minusDay = 3;
    }

    const yesterday = today.setDate(today.getDate() - minusDay);

    const startYesterday = new Date(yesterday);
    startYesterday.setUTCHours(0, 0, 0, 0);
    const endYesterday = new Date(yesterday);
    endYesterday.setUTCHours(23, 59, 59, 999);

    // Check yesterday time sheet
    const existingWorkLog = await this.workLogRepository.count({
      where: {
        company_id: currentUser.company_id,
        user_id: currentUser.id,
        date: {
          [Op.gte]: startYesterday,
          [Op.lte]: endYesterday,
        },
        deleted_at: {
          [Op.is]: null,
        },
        spent_in_hour: {
          [Op.gt]: 0,
        },
      },
    });

    return existingWorkLog > 0;
  }
}
