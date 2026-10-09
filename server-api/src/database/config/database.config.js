/* eslint-disable @typescript-eslint/no-var-requires */
const { config } = require('dotenv');
const { join } = require('path');

// Load environment variables manually
config({ path: join(process.cwd(), 'env', `${process.env.NODE_ENV}.env`) });

const dbConfig = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    dialect: 'postgres',
    dialectOptions: {},
    migrationStorageTableName: 'sequelize_migration_histories',
  },
  staging: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    dialect: 'postgres',
    dialectOptions: {},
    migrationStorageTableName: 'sequelize_migration_histories',
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    dialect: 'postgres',
    dialectOptions: {},
    migrationStorageTableName: 'sequelize_migration_histories',
  },
};

module.exports = dbConfig;