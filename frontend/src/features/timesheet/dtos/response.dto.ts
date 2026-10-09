export interface ResponseTimeSheet<T> {
  error: boolean;
  payload?: T;
  holidays?: T;
  message?: string;
}
