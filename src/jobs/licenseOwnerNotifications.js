const { processLicenseOwnerNotifications } = require("../services/licenseOwnerNotificationService");

function startLicenseOwnerNotificationCron() {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const run = () => {
    processLicenseOwnerNotifications().catch((err) => {
      console.error("[cron] processLicenseOwnerNotifications:", err.message || err);
    });
  };
  run();
  setInterval(run, DAY_MS);
}

module.exports = {
  startLicenseOwnerNotificationCron,
  processLicenseOwnerNotifications,
};
