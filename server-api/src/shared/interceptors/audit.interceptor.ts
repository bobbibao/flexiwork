import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Op } from 'sequelize';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { resolveJwtSecret } from '../utils/jwt-secret';

import { AuditCreateDto } from '../dto';
import {
  AUDIT_MODULE_METADATA_KEY,
  AuditModuleEnum,
  AuditActionEnum,
  AUDIT_ACTION_METADATA_KEY,
} from '../constants/audit.constants';
import {
  AuditLog,
  Company,
  Customer,
  Expense,
  Invoice,
  InvoiceDetail,
  Offer,
  OfferDetail,
  Product,
  Project,
  ProjectDetail,
  Task,
  User,
  UserHoliday,
  WorkItem,
} from 'src/database/models';

import type { Request, Response } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Extracts the module name from the request context.
   * This is used to identify which module the audit log belongs to.
   * @param context - The execution context of the request.
   * @return The module name as a string.
   * */
  private _getModuleNameFromContext(context: ExecutionContext): string {
    return Reflect.getMetadata(AUDIT_MODULE_METADATA_KEY, context.getClass());
  }

  /**
   * Extracts the action type from the request context.
   * This is used to identify the type of action being audited (e.g., CREATE, UPDATE).
   * @param context - The execution context of the request.
   * @return The action type as a string.
   */
  private _getActionFromContext(context: ExecutionContext): string {
    return Reflect.getMetadata(AUDIT_ACTION_METADATA_KEY, context.getHandler());
  }

  /**
   * Extracts the user ID from the JWT code.
   * This is used to identify the user performing the action being audited.
   * @param code - The JWT code containing user information.
   * @return The user ID as a number, or null if decoding fails.
   * */
  private _extractUserIdFromCode(code: string): number {
    try {
      // You'll need to inject ConfigService in the constructor
      const secretKey = resolveJwtSecret(this.configService);
      const decoded = this.jwtService.verify(code, {
        algorithms: ['HS256'],
        secret: secretKey,
        ignoreExpiration: true, // Adjust based on your needs
      });
      return Number(decoded.sub);
    } catch (error) {
      throw new Error('Failed to decode JWT code: ' + error);
    }
  }

  /**
   * Retrieves the object ID from the request based on the module name.
   * This is used to identify the specific object being audited.
   * @param moduleName - The name of the module for which the audit is being logged.
   * @param request - The incoming request object.
   * @return The object ID as a number, or null if not found.
   * */
  private _getObjectId(moduleName: string, request: Request): number | null {
    const capturedParams = request.params || {},
      capturedQuery = request.query || {};

    let objectId: number | null = null;

    switch (moduleName) {
      case AuditModuleEnum.TASK:
      case AuditModuleEnum.USER:
      case AuditModuleEnum.OFFER:
      case AuditModuleEnum.PROJECT:
      case AuditModuleEnum.INVOICE:
      case AuditModuleEnum.EXPENSE:
      case AuditModuleEnum.WORK_ITEM:
      case AuditModuleEnum.CUSTOMER:
      case AuditModuleEnum.PRODUCT:
      case AuditModuleEnum.COMPANY: {
        objectId = Number(capturedParams.id) || null;
        break;
      }
      case AuditModuleEnum.EXPORT: {
        // For EXPORT module, we might need to extract the object ID from the query parameters
        objectId = Number(capturedQuery.id) || null;
        break;
      }
    }

    return objectId;
  }

  /**
   * Constructs the audit data from the request.
   * This includes user ID, API endpoint, and action type based on the HTTP method.
   * @param request - The incoming request object.
   * @return An object containing the audit data.
   */
  private _getAuditDataFromRequest(request: Request): Partial<AuditCreateDto> {
    const result: Partial<AuditCreateDto> = {};

    // Extract user ID from the request, assuming it's stored in the user object
    if (request.user && request.user.id) {
      result.user_id = Number(request.user.id as string);
    } else {
      // Handle the case where user ID is not available
    }

    // Extract api endpoint and user information from the request
    result.api_endpoint = request.originalUrl;

    // Extract audit action based on the HTTP method
    switch (request.method.toUpperCase()) {
      case 'GET':
        result.action = AuditActionEnum.VIEW;
        break;
      case 'POST':
        result.action = AuditActionEnum.CREATE;
        break;
      case 'PUT':
      case 'PATCH':
        result.action = AuditActionEnum.UPDATE;
        break;
      case 'DELETE':
        result.action = AuditActionEnum.DELETE;
        break;
      default:
        break;
    }

    return result;
  }

  /**
   * Retrieves the data to be logged before and after the request is processed.
   * @param moduleName - The name of the module for which the audit is being logged.
   * @param request - The incoming request object.
   * @param _response - The outgoing response object.
   * @return An object representing the 'before' or 'after' state of the data.
   */
  private async _getData(
    moduleName: AuditModuleEnum,
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _response: Response,
  ): Promise<AuditCreateDto['before'] | AuditCreateDto['after']> {
    const capturedParams = request.params || {},
      capturedBody = request.body || {},
      apiEndpoint = request.originalUrl || '';

    let beforeData: AuditCreateDto['before'] | AuditCreateDto['after'] = {};

    switch (moduleName) {
      case AuditModuleEnum.USER: {
        const id = Number(capturedParams.id);
        if (id) {
          beforeData = await User.findOne({
            where: { id },
            raw: true,
          });
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.AUTH: {
        // Add specific logic for AUTH module
        break;
      }
      case AuditModuleEnum.DASHBOARD: {
        // Add specific logic for DASHBOARD module
        break;
      }
      case AuditModuleEnum.TASK: {
        // If the API endpoint is for bulk operations, handle it accordingly
        if (apiEndpoint.includes('/bulk')) {
          const ids = capturedBody.ids || [];
          if (ids.length > 0) {
            beforeData = await Task.findAll({
              where: { id: { [Op.in]: ids } },
            }).then((tasks) => tasks.map((task) => task.get({ plain: true })));
          }
          break;
        }
        const id = Number(capturedParams.id);
        if (id) {
          await Task.findOne({
            where: { id },
          }).then((taskInfo) => {
            beforeData = taskInfo.get({ plain: true });
          });
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.OFFER: {
        // If the API endpoint is for bulk operations, handle it accordingly
        if (apiEndpoint.includes('/bulk')) {
          const ids = capturedBody.ids || [];
          if (ids.length > 0) {
            beforeData = await Offer.findAll({
              where: { id: { [Op.in]: ids } },
            }).then((offers) => offers.map((offer) => offer.get({ plain: true })));
          }
          break;
        }
        const id = Number(capturedParams.id);
        if (id) {
          await Offer.findOne({
            where: { id },
            include: [{ all: true }, { model: OfferDetail, as: 'details', include: [{ all: true }] }],
          }).then((offerInfo) => {
            beforeData = offerInfo.get({ plain: true });
          });
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.PROJECT: {
        // If the API endpoint is for bulk operations, handle it accordingly
        if (apiEndpoint.includes('/bulk')) {
          const ids = capturedBody.ids || [];
          if (ids.length > 0) {
            beforeData = await Project.findAll({
              where: { id: { [Op.in]: ids } },
            }).then((projects) => projects.map((prj) => prj.get({ plain: true })));
          }
          break;
        }
        const id = Number(capturedParams.id);
        if (id) {
          await Project.findOne({
            where: { id },
            include: [{ all: true }, { model: ProjectDetail, as: 'details', include: [{ all: true }] }],
          }).then((prjInfo) => {
            beforeData = prjInfo.get({ plain: true });
          });
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.INVOICE: {
        // If the API endpoint is for bulk operations, handle it accordingly
        if (apiEndpoint.includes('/bulk')) {
          const ids = capturedBody.ids || [];
          if (ids.length > 0) {
            beforeData = await Invoice.findAll({
              where: { id: { [Op.in]: ids } },
            }).then((invoices) => invoices.map((invoice) => invoice.get({ plain: true })));
          }
          break;
        }
        const id = Number(capturedParams.id);
        if (id) {
          await Invoice.findOne({
            where: { id },
            include: [{ all: true }, { model: InvoiceDetail, as: 'details', include: [{ all: true }] }],
          }).then((invInfo) => {
            beforeData = invInfo.get({ plain: true });
          });
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.EXPENSE: {
        const id = Number(capturedParams.id);
        if (id) {
          await Expense.findOne({
            where: { id },
            include: [{ all: true }],
          }).then((expenseInfo) => {
            beforeData = expenseInfo.get({ plain: true });
          });
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.WORK_ITEM: {
        // Add specific logic for WORK_ITEM module
        const id = Number(capturedParams.id);
        if (id) {
          if (apiEndpoint.includes('holiday')) {
            await UserHoliday.findOne({
              where: { id },
              include: [{ all: true }],
            }).then((holidayInfo) => {
              beforeData = holidayInfo.get({ plain: true });
            });
          } else {
            await WorkItem.findOne({
              where: { id },
              include: [{ all: true }],
            }).then((workItemInfo) => {
              beforeData = workItemInfo.get({ plain: true });
            });
          }
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.CUSTOMER: {
        const id = Number(capturedParams.id);
        if (id) {
          await Customer.findOne({
            where: { id },
            include: [{ all: true }],
          }).then((customerInfo) => {
            beforeData = customerInfo.get({ plain: true });
          });
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.PRODUCT: {
        const id = Number(capturedParams.id);
        if (id) {
          await Product.findOne({
            where: { id },
            include: [{ all: true }],
          }).then((productInfo) => {
            beforeData = productInfo.get({ plain: true });
          });
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.COMPANY: {
        const signature = String(capturedParams.sign);
        if (signature) {
          // Assuming there's a method to get company data by sign
          await Company.findOne({
            where: { signature },
            include: [{ all: true }],
          }).then((companyInfo) => {
            beforeData = companyInfo.get({ plain: true });
          });
        } else {
          beforeData = request.body;
        }
        break;
      }
      case AuditModuleEnum.EXPORT: {
        // Add specific logic for EXPORT module
        break;
      }
      case AuditModuleEnum.SETTING: {
        // Add specific logic for SETTING module
        break;
      }
      case AuditModuleEnum.REPORT: {
        // Add specific logic for REPORT module
        break;
      }
      default: {
        // Handle unknown module or default case
        break;
      }
    }

    return beforeData;
  }

  /**
   * Intercepts the request and logs audit information.
   * This method extracts the necessary data from the request and logs it.
   * @param context - The execution context of the request.
   * @param next - The call handler to pass the request to the next interceptor or controller.
   * @return An observable that emits the result of the request handling.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    try {
      const request: Request = context.switchToHttp().getRequest();
      const response: Response = context.switchToHttp().getResponse();
      const moduleName = this._getModuleNameFromContext(context);
      const action = this._getActionFromContext(context),
        shouldLog: boolean = !!action && Object.values(AuditActionEnum).includes(action as AuditActionEnum);

      // Only proceed if the action is valid
      if (shouldLog) {
        const auditDataFromRequest: Partial<AuditCreateDto> = this._getAuditDataFromRequest(request);
        auditDataFromRequest.module = moduleName as AuditModuleEnum;
        auditDataFromRequest.before = await this._getData(moduleName as AuditModuleEnum, request, response);
        const objectId: number | null = this._getObjectId(moduleName as AuditModuleEnum, request);

        return next.handle().pipe(
          tap(async () => {
            try {
              auditDataFromRequest.after = await this._getData(moduleName as AuditModuleEnum, request, response);
              // If the object ID is available, add it to the audit data
              if (objectId) {
                auditDataFromRequest.object_id = objectId;
              }
              // For EXPORT module, we need to extract the user_id from the `code` (jwt token) query parameter
              if (auditDataFromRequest.module === AuditModuleEnum.EXPORT) {
                auditDataFromRequest.user_id = this._extractUserIdFromCode(request.query.code as string);
              }
              await AuditLog.create({
                ...auditDataFromRequest,
                created_at: new Date(),
              });
            } catch (error) {
              // Handle any errors that occur during the audit logging
              console.error('Error when logging audit:', error);
            }
          }),
        );
      }
    } catch (error) {
      // Handle the case where an error occurs
      // Optionally, you can log the error or perform any other actions
      console.error('Error in AuditInterceptor:', error);
    }

    // For cases where the module name is not defined or an error occurs
    return next.handle();
  }
}
