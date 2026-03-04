/**
 * Admin Seeder File
 * 
 * This file contains the predefined admin credentials for the ElephantGuard app.
 * Admin users have access to the Calibration and Alerts pages.
 * Regular users can only access the Dashboard and Profile pages.
 * 
 * To add more admins, add their email addresses to the ADMIN_EMAILS array.
 */

const ADMIN_EMAILS = [
  'admin@elephantguard.com',
];

const ADMIN_SEED = {
  email: 'admin@elephantguard.com',
  password: 'Admin@123',
  displayName: 'System Admin',
  trainNumber: 'ADMIN-001',
};

/**
 * Check if a given email belongs to an admin user
 * @param {string} email - The email to check
 * @returns {boolean} - True if the email belongs to an admin
 */
const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

export { ADMIN_EMAILS, ADMIN_SEED, isAdminEmail };
export default { ADMIN_EMAILS, ADMIN_SEED, isAdminEmail };
