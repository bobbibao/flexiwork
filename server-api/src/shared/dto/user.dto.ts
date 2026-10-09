import User from "src/database/models/users.model";

export class BaseUser extends User {
  rate: string;
}

export class JobRates {
  label: string;
  rate: string;
}