import { Body, Controller, Delete, Get, Logger, Param, ParseUUIDPipe, Post, Put, Query, Res, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import User from 'src/database/models/users.model';
import { SnBaseController } from 'src/shared/controllers/sn-base.controller';
import { AuditModule, CurrentUser, PublicRoute } from 'src/shared/decorators';
import { AuditModuleEnum } from 'src/shared/constants/audit.constants';
import { snValidationPipe } from 'src/shared/pipes/sn-validation.pipe';
import { NotificationService } from '../services/notification.service';
import { ListNotificationsDto, PreferencesDto, PushSubscriptionDto } from '../dto/notification.dto';

@Controller('api/sn')
@ApiTags('sn-notifications')
@AuditModule(AuditModuleEnum.NOTIFICATION)
@UsePipes(snValidationPipe)
export class NotificationController extends SnBaseController {
  constructor(private readonly notifications: NotificationService) {
    super(new Logger(NotificationController.name));
  }

  @Get('notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My notifications (with unread count)', operationId: 'snListNotifications' })
  async list(@Res() res: Response, @CurrentUser() user: User, @Query() q: ListNotificationsDto) {
    try {
      return this.ok(res, await this.notifications.list(user.id, q.page ?? 1, q.page_size ?? 20));
    } catch (error) {
      return this.fail('List notifications', res, error);
    }
  }

  @Post('notifications/read-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all as read', operationId: 'snReadAllNotifications' })
  async readAll(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.notifications.markAllRead(user.id));
    } catch (error) {
      return this.fail('Read all notifications', res, error);
    }
  }

  @Post('notifications/:id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark one as read', operationId: 'snReadNotification' })
  async read(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.notifications.markRead(user.id, id));
    } catch (error) {
      return this.fail('Read notification', res, error);
    }
  }

  @PublicRoute()
  @Get('push/vapid-public-key')
  @ApiOperation({ summary: 'VAPID public key for Web Push', operationId: 'snGetVapidKey' })
  async vapid(@Res() res: Response) {
    return this.ok(res, this.notifications.vapidPublicKey());
  }

  @Post('push-subscriptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a Web Push / FCM subscription', operationId: 'snSubscribePush' })
  async subscribe(@Res() res: Response, @CurrentUser() user: User, @Body() dto: PushSubscriptionDto) {
    try {
      return this.ok(res, await this.notifications.subscribe(user.id, dto));
    } catch (error) {
      return this.fail('Subscribe push', res, error);
    }
  }

  @Delete('push-subscriptions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a push subscription', operationId: 'snUnsubscribePush' })
  async unsubscribe(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.notifications.unsubscribe(user.id, id));
    } catch (error) {
      return this.fail('Unsubscribe push', res, error);
    }
  }

  @Get('notification-preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My channel preferences', operationId: 'snGetNotificationPreferences' })
  async getPrefs(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.notifications.preferences(user.id));
    } catch (error) {
      return this.fail('Get preferences', res, error);
    }
  }

  @Put('notification-preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my channel preferences', operationId: 'snUpdateNotificationPreferences' })
  async putPrefs(@Res() res: Response, @CurrentUser() user: User, @Body() dto: PreferencesDto) {
    try {
      return this.ok(res, await this.notifications.updatePreferences(user.id, dto as Record<string, boolean>));
    } catch (error) {
      return this.fail('Update preferences', res, error);
    }
  }
}
