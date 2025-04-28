/**
 * Utility functions for building the site
 */

const { exec } = require('child_process');

/**
 * Trigger a site rebuild
 * @param {Function} callback - Callback function to execute after build
 */
const triggerRebuild = (callback) => {
  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      console.error(`Build error: ${error.message}`);
      if (callback) callback(error);
      return;
    }

    console.log(`Build output: ${stdout}`);
    if (stderr) console.error(`Build stderr: ${stderr}`);
    
    if (callback) callback(null, stdout);
  });
};

module.exports = {
  triggerRebuild
};
