export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  /** Database configs */
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT) || 5432,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_ENCRYPT: process.env.DB_ENCRYPT,
  /** MailGun configs */
  MAILGUN_BASE_URL: process.env.MAILGUN_BASE_URL,
  MAILGUN_PRIVATE_KEY: process.env.MAILGUN_PRIVATE_KEY,
  MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN,
  MAILGUN_SENDER: process.env.MAILGUN_SENDER,
  /** Logging configs */
  LOGGING_LEVEL: process.env.LOGGING_LEVEL,
  LOGGING_DAYS: process.env.LOGGING_DAYS,
  LOGGING_FOLDER_PATH: process.env.LOGGING_FOLDER_PATH,
  /** Folder path configs */
  UPLOADS_API_PATH: process.env.UPLOADS_API_PATH,
  UPLOAD_PATH: process.env.UPLOAD_PATH,
  /** Other configs */
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL,
  ADMIN_TOKEN_EXPIRES_IN: process.env.ADMIN_TOKEN_EXPIRES_IN,
  EMPLOYEE_TOKEN_EXPIRES_IN: process.env.EMPLOYEE_TOKEN_EXPIRES_IN,
});
