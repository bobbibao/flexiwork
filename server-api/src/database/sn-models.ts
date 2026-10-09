/**
 * Shift Network models, registered in database.provider.ts (docs/ARCHITECTURE.md §15.1).
 * Tables are created by migrations in migrations/v0.1.0 (run them before the first boot).
 */
import EventStoreEntry from './models/event-store.model';
import AggregateSnapshot from './models/aggregate-snapshots.model';
import OutboxMessage from './models/outbox-messages.model';
import ProcessedMessage from './models/processed-messages.model';
import ProjectionCheckpoint from './models/projection-checkpoints.model';
import WorkerProfile from './models/worker-profiles.model';
import EmployerProfile from './models/employer-profiles.model';
import WorkLocation from './models/work-locations.model';
import Skill from './models/skills.model';
import ShiftView from './models/shift-views.model';
import WorkerShiftReservation from './models/worker-shift-reservations.model';
import LedgerAccount from './models/ledger-accounts.model';
import LedgerJournal from './models/ledger-journals.model';
import LedgerEntry from './models/ledger-entries.model';
import LedgerBalance from './models/ledger-balances.model';
import PaymentIntent from './models/payment-intents.model';
import Rating from './models/ratings.model';
import Notification from './models/notifications.model';
import NotificationDelivery from './models/notification-deliveries.model';
import PushSubscription from './models/push-subscriptions.model';
import NotificationPreference from './models/notification-preferences.model';
import ExceptionCase from './models/exception-cases.model';
import AutonomyPolicy from './models/autonomy-policies.model';
import DecisionRecord from './models/decision-records.model';
import DlqMessage from './models/dlq-messages.model';
// Existing legacy models that User references (@BelongsToMany Role through UserRoles) but that were never
// registered, so `new Sequelize({ models })` threw "UserRoles has not been defined" even on the baseline.
// Registering them is additive (sync creates the tables only if missing). See ARCHITECTURE.md ADR-015.
import Role from './models/roles.model';
import { UserRoles } from './models/user-roles.model';
import AccessControl from './models/access-controls.model';

export {
  EventStoreEntry,
  AggregateSnapshot,
  OutboxMessage,
  ProcessedMessage,
  ProjectionCheckpoint,
  WorkerProfile,
  EmployerProfile,
  WorkLocation,
  Skill,
  ShiftView,
  WorkerShiftReservation,
  LedgerAccount,
  LedgerJournal,
  LedgerEntry,
  LedgerBalance,
  PaymentIntent,
  Rating,
  Notification,
  NotificationDelivery,
  PushSubscription,
  NotificationPreference,
  ExceptionCase,
  AutonomyPolicy,
  DecisionRecord,
  DlqMessage,
};

export const SN_MODELS = [
  Role,
  UserRoles,
  AccessControl,
  EventStoreEntry,
  AggregateSnapshot,
  OutboxMessage,
  ProcessedMessage,
  ProjectionCheckpoint,
  WorkerProfile,
  EmployerProfile,
  WorkLocation,
  Skill,
  ShiftView,
  WorkerShiftReservation,
  LedgerAccount,
  LedgerJournal,
  LedgerEntry,
  LedgerBalance,
  PaymentIntent,
  Rating,
  Notification,
  NotificationDelivery,
  PushSubscription,
  NotificationPreference,
  ExceptionCase,
  AutonomyPolicy,
  DecisionRecord,
  DlqMessage,
];
