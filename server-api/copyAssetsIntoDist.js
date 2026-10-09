/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs').promises;
const path = require('path');

const basePath = process.cwd();
const assetPaths = ['src/templates'];
const distPath = path.resolve(basePath, 'dist');

// Check if the `dist` folder exists
(async () => {
  try {
    // Verify the dist folder exists
    try {
      await fs.access(distPath);
    } catch {
      throw new Error('Error: dist folder does not exist, please run `yarn run start-dev` first!');
    }

    // Recursive copy function
    const copyRecursive = async (src, dest) => {
      // Ensure destination directory exists
      await fs.mkdir(dest, { recursive: true });

      // Read items in the source directory
      const items = await fs.readdir(src, { withFileTypes: true });

      for (const item of items) {
        const srcPath = path.join(src, item.name);
        const destPath = path.join(dest, item.name);

        if (item.isDirectory()) {
          // If the item is a directory, call the function recursively
          await copyRecursive(srcPath, destPath);
        } else {
          // If the item is a file, copy it to the destination
          await fs.copyFile(srcPath, destPath);
        }
      }
    };

    // Copy assets into the `dist` folder
    for (const assetPath of assetPaths) {
      const assetAbsolutePath = path.resolve(basePath, assetPath);
      const targetPath = path.join(distPath, assetPath);

      try {
        await fs.access(assetAbsolutePath);
      } catch {
        throw new Error(`Error: asset folder ${assetPath} does not exist!`);
      }

      await copyRecursive(assetAbsolutePath, targetPath);
    }

    console.log('Assets copied successfully!');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
