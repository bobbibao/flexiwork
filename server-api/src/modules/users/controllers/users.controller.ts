import { Response } from 'express';
import User from 'src/database/models/users.model';
import { CompanyService } from 'src/modules/company/services/company.service';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser, PublicRoute } from 'src/shared/decorators';
import { BadRequestError, UnauthorizedError } from 'src/shared/utils';
import { ApiResponse } from 'src/shared/utils/api-response';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDecorator, ApiTags } from '@nestjs/swagger';
import {
  ChangePasswordDto,
  CreateUserDto,
  EditUserDto,
  ForgotPasswordDto,
  ListUserDto,
  LoginUserDto,
  MultipleAccountResponseDto,
  RegisterUserDto,
  ResetPasswordDto,
  ToggleUserStatusDto,
  UpdateTimeSheetPeriodDto,
  VerifyRegisterDto,
} from '../dto';
import { UsersService } from '../services/user.service';
import { AuditModuleEnum } from 'src/shared/constants/audit.constants';

@Controller('api')
@ApiTags('Users')
@AuditModule(AuditModuleEnum.USER)
export class UsersController extends BaseController {
  constructor(
    private readonly userService: UsersService,
    private readonly companyService: CompanyService,
  ) {
    super(new Logger(UsersController.name));
  }

  @Get('/users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users', operationId: 'getAllUser' })
  @ApiResponseDecorator({
    status: 200,
    type: ListUserDto,
    description: 'Get all users',
    isArray: true,
  })
  async getAllUser(@Res() res: Response, @CurrentUser() currentUser: User) {
    try {
      const { users, count } = await this.userService.findAllUser(currentUser.company_id);

      return this.sendApiResponse(res, {
        error: false,
        count,
        payload: users,
      });
    } catch (error) {
      return this.throwError('Get all users', res, error);
    }
  }

  @Get('/simple-users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get simple active users', operationId: 'getSimpleActiveUsers' })
  @ApiResponseDecorator({
    status: 200,
    type: ListUserDto,
    description: 'Get simple active users',
    isArray: true,
  })
  async listSimpleActiveUsers(@Res() res: Response, @CurrentUser() currentUser: User) {
    try {
      const { users, count } = await this.userService.getSimpleActiveUsers(currentUser);

      return this.sendApiResponse(res, {
        error: false,
        count,
        payload: users,
      });
    } catch (error) {
      return this.throwError('Get simple active users', res, error);
    }
  }

  @Get('/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user', operationId: 'verifyCurrentUser' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Get current user',
    isArray: false,
  })
  async getCurrentUser(@Res() res: Response, @CurrentUser() currentUser: User) {
    try {
      const company = await this.companyService.selectCompany(currentUser.company_id);

      // Handle user before return
      const user = currentUser.toJSON();
      delete user.password;
      delete user.metadata;
      delete user.nickname;
      delete user.deleted_at;

      const hasYesterdayTimesheet: boolean = await this.userService.checkYesterdayTimeSheet(currentUser);

      return this.sendApiResponse(res, {
        error: false,
        payload: {
          ...user,
          missing_timesheet_data: !hasYesterdayTimesheet,
        },
        language: company.language,
      });
    } catch (error) {
      return this.throwError('Get current user', res, error);
    }
  }

  @PublicRoute()
  @Get('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user', operationId: 'logout' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Logout',
    isArray: false,
  })
  async logout() {
    return new ApiResponse({
      error: false,
    });
  }

  @Get('/user/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detail user', operationId: 'getDetailUser' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Get detail user',
    isArray: false,
  })
  async getDetailUser(@Res() res: Response, @Param('id') id: string, @CurrentUser() currentUser: User) {
    try {
      const user = await this.userService.findUserById(currentUser, id);

      return this.sendApiResponse(res, { error: false, payload: user });
    } catch (error) {
      return this.throwError('Get detail user', res, error);
    }
  }

  @PublicRoute()
  @Post('/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login', operationId: 'login' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'User login response',
    isArray: false,
  })
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    try {
      // Check missing inputs
      const { email, password } = loginUserDto;
      if (!email || !password) {
        throw new BadRequestError('Invalid credentials');
      }

      // Handle login
      loginUserDto.email = loginUserDto.email.trim();
      loginUserDto.password = loginUserDto.password.trim();

      const authResponse = await this.userService.login(loginUserDto);

      // Throw error if multiple accounts was found
      const multipleAccountResponse = authResponse as MultipleAccountResponseDto;
      if (multipleAccountResponse.error) {
        return res.status(406).json({
          error: true,
          statusCode: 406,
          message: multipleAccountResponse.error,
          companies: multipleAccountResponse.companies,
        });
      }

      return res.status(200).json({
        error: false,
        payload: authResponse,
      });
    } catch (error) {
      return this.throwError('Login', res, error);
    }
  }

  @PublicRoute()
  @Post('/register')
  @HttpCode(200)
  @ApiOperation({ summary: 'Register', operationId: 'register' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'User register response',
    isArray: false,
  })
  async register(@Res() res: Response, @Body() registerUserDto: RegisterUserDto) {
    try {
      // Check missing inputs
      const { email, currency, language, company, accept_term: acceptTerm } = registerUserDto;
      if (!email) {
        throw new BadRequestError('Email is required');
      } else if (!currency) {
        throw new BadRequestError('Currency is required');
      } else if (!language) {
        throw new BadRequestError('Language is required');
      } else if (!company) {
        throw new BadRequestError('Company is required');
      } else if (!acceptTerm) {
        throw new BadRequestError('Accept term is required');
      }

      // Handle register
      registerUserDto.email = registerUserDto.email.trim();
      registerUserDto.currency = registerUserDto.currency.trim();
      registerUserDto.language = registerUserDto.language.trim();
      registerUserDto.company = registerUserDto.company.trim();

      const result = await this.userService.register(registerUserDto);

      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Register', res, error);
    }
  }

  @PublicRoute()
  @Post('/active-code/:code')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify register', operationId: 'verifyRegister' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Verify register response',
    isArray: false,
  })
  async verifyRegister(
    @Res() res: Response,
    @Body() verifyRegisterDto: VerifyRegisterDto,
    @Param('code') code: string,
  ) {
    try {
      // Check missing inputs
      const { password, confirm_password: confirmPassword } = verifyRegisterDto;
      if (!password) {
        throw new UnauthorizedError('Password is required');
      } else if (!confirmPassword) {
        throw new UnauthorizedError('Confirm password is required');
      }

      // Handle verify register
      verifyRegisterDto.password = verifyRegisterDto.password.trim();
      verifyRegisterDto.confirm_password = verifyRegisterDto.confirm_password.trim();

      const result = await this.userService.verifyRegister(verifyRegisterDto, code);
      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Verify register', res, error);
    }
  }

  @Post('/change-password')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password', operationId: 'changePassword' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Change password response',
    isArray: false,
  })
  async changePassword(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      // Check missing inputs
      const { current_password: currentPassword, password, confirm_password: confirmPassword } = changePasswordDto;
      if (!currentPassword) {
        throw new UnauthorizedError('Current password is required');
      } else if (!password) {
        throw new UnauthorizedError('Password is required');
      } else if (!confirmPassword) {
        throw new UnauthorizedError('Confirm password is required');
      }

      // Handle change password
      changePasswordDto.current_password = changePasswordDto.current_password.trim();
      changePasswordDto.password = changePasswordDto.password.trim();
      changePasswordDto.confirm_password = changePasswordDto.confirm_password.trim();

      const result = await this.userService.changePassword(currentUser, changePasswordDto);
      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Change password', res, error);
    }
  }

  @PublicRoute()
  @Post('/forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Forgot password', operationId: 'forgotPassword' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Forgot password response',
    isArray: false,
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Res() res: Response) {
    try {
      // Check missing inputs
      const { email } = forgotPasswordDto;
      if (!email) {
        throw new UnauthorizedError('Email is required');
      }

      // Handle forgot password
      forgotPasswordDto.email = forgotPasswordDto.email.trim();

      const result = await this.userService.forgotPassword(forgotPasswordDto);

      // Throw error if multiple accounts was found
      const multipleAccountResponse = result as MultipleAccountResponseDto;
      if (multipleAccountResponse.error) {
        return res.status(406).json({
          error: true,
          statusCode: 406,
          message: multipleAccountResponse.error,
          companies: multipleAccountResponse.companies,
        });
      }

      return res.status(200).json({
        error: !result,
      });
    } catch (error) {
      return this.throwError('Forgot password', res, error);
    }
  }

  @PublicRoute()
  @Post('/forgot-password/:code')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password', operationId: 'resetPassword' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Reset password response',
    isArray: false,
  })
  async resetPassword(@Res() res: Response, @Param('code') code: string, @Body() resetPasswordDto: ResetPasswordDto) {
    try {
      // Check missing inputs
      const { password, confirm_password: confirmPassword } = resetPasswordDto;
      if (!password) {
        throw new UnauthorizedError('Missing password');
      } else if (!confirmPassword) {
        throw new UnauthorizedError('Missing confirm password');
      }

      // Handle reset password
      resetPasswordDto.password = resetPasswordDto.password.trim();
      resetPasswordDto.confirm_password = resetPasswordDto.confirm_password.trim();

      const result = await this.userService.resetPassword(code, resetPasswordDto);
      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Reset password', res, error);
    }
  }

  @Post('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user', operationId: 'createUser' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Create user response',
    isArray: false,
  })
  async createUser(@Res() res: Response, @CurrentUser() currentUser: User, @Body() createUserDto: CreateUserDto) {
    try {
      const result = await this.userService.createUser(currentUser, createUserDto);

      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Create user', res, error);
    }
  }

  @Put('/user/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user', operationId: 'updateUser' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Update user response',
    isArray: false,
  })
  async updateUser(@Res() res: Response, @Param('id') id: string, @Body() editUserDto: EditUserDto) {
    try {
      // Handle update user
      const result = await this.userService.updateUser(id, editUserDto);
      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Update user', res, error);
    }
  }

  @Put('/user/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle user status', operationId: 'toggleUserStatus' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Toggle user status response',
    isArray: false,
  })
  async toggleUserStatus(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() toggleUserStatusDto: ToggleUserStatusDto,
  ) {
    try {
      // Check missing inputs
      const { is_active: isActive } = toggleUserStatusDto;
      if (typeof isActive !== 'boolean') {
        throw new BadRequestError('Missing is active');
      }

      // Handle toggle user status
      const result = await this.userService.toggleUserStatus(id, toggleUserStatusDto);

      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Toggle user status', res, error);
    }
  }

  @UseInterceptors(FileInterceptor('file'))
  @Put('/user/:id/avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user avatar', operationId: 'updateUserAvatar' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Update user avatar response',
    isArray: false,
  })
  async updateAvatar(@Res() res: Response, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    try {
      const result = await this.userService.updateAvatar(id, file);
      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Update user avatar', res, error);
    }
  }

  @Put('/user/:id/timesheet-periods')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user timesheet periods', operationId: 'updateUserTimesheetPeriods' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Update user timesheet periods response',
    isArray: false,
  })
  async updateTimesheetPeriods(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateUserTimeSheetPeriodsDto: UpdateTimeSheetPeriodDto[],
  ) {
    try {
      const result = await this.userService.updateUserTimeSheetPeriods(id, updateUserTimeSheetPeriodsDto);
      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Update user timesheet periods', res, error);
    }
  }

  @Delete('/user/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user', operationId: 'deleteUser' })
  @ApiResponseDecorator({
    status: 200,
    type: ApiResponse,
    description: 'Delete user response',
    isArray: false,
  })
  async deleteUser(@Res() res: Response, @CurrentUser() currentUser: User, @Param('id') id: string) {
    try {
      const result = await this.userService.deleteUser(currentUser, id);
      return this.sendApiResponse(res, { error: !result });
    } catch (error) {
      return this.throwError('Delete user', res, error);
    }
  }
}
