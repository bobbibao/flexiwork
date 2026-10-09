# server-api

# Database Migration Scripts

Database migration scripts help you synchronize your database across different environments, even while the application is running. This document provides instructions on how to use and manage these scripts effectively.

## Steps
### Step 1: Create Migration Files
To create a migration file, you can either manually create it using a predefined template for full control over the migration logic and structure, or use a command defined in your `package.json` for quicker, consistent file generation.

  **Method 1: Manual Creation**
  - You can manually create a migration file. Use the following skeleton as a template:

    ```javascript
    module.exports = {
      up: (queryInterface, Sequelize) => {
        // logic for transforming into the new state
      },
      down: (queryInterface, Sequelize) => {
        // logic for reverting the changes
      },
    };
    ```
  **Method 2: Using Command in `package.json`**
  - Use the command provided in `package.json` to automatically generate a migration file with a similar structure. For example:

    ```bash
    npm run migrate:generate -- --name migration_name
    ```
  - This command will automatically create a file named `xxx-migration_name.js` in your migration folder, where `xxx` is a timestamp-based string generated at the time of file creation.

- **Note:** Refer to the Sequelize CLI documentation for detailed information on writing migrations: [Sequelize CLI Documentation](https://sequelize.org/docs/v7/cli/#writing-a-migration).

- **Important**: Since you define the logic in the migration files, please make sure the implementation is correct and works as intended.

### Step 2: Apply or Rollback Migrations
After creating your migration files, you can apply or rollback these migrations to manage your database schema changes.

- **To apply changes to the database:**
  ```bash
  npm run migrate:<environment>
  ```
  Replace `<environment>` with one of the following:
  - `dev` for environment **development**
  - `staging` for environment **staging**
  - `prod` for environment **production**

- **To rollback the most recent migration:**
  ```bash
  npm run rollback:<environment>
  ```
  Replace `<environment>` with one of the above values.

Ensure you have the correct environment set up before running these commands to avoid any unintended changes.
