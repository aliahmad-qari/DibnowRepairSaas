const Notification = require('../models/Notification');

/**
 * Create notification for admin (global)
 */
const notifyAdmin = async (title, message, type = 'info') => {
  try {
    await Notification.create({
      userId: 'global',
      title,
      message,
      type
    });
    console.log(`[Notification] Admin notified: ${title}`);
  } catch (error) {
    console.error('[Notification] Failed to notify admin:', error);
  }
};

/**
 * Create notification for specific user
 */
const notifyUser = async (userId, title, message, type = 'info') => {
  try {
    await Notification.create({
      userId: userId.toString(),
      ownerId: userId,
      title,
      message,
      type
    });
    console.log(`[Notification] User ${userId} notified: ${title}`);
  } catch (error) {
    console.error('[Notification] Failed to notify user:', error);
  }
};

/**
 * Notify admin when user performs an action
 */
const notifyAdminUserAction = async (userName, action, details = '') => {
  const title = `User Activity: ${action}`;
  const message = `${userName} ${action}${details ? ': ' + details : ''}`;
  await notifyAdmin(title, message, 'info');
};

/**
 * Notify user when admin performs an action
 */
const notifyUserAdminAction = async (userId, action, details = '') => {
  const title = `Admin Update: ${action}`;
  const message = `Administrator ${action}${details ? ': ' + details : ''}`;
  await notifyUser(userId, title, message, 'success');
};

module.exports = {
  notifyAdmin,
  notifyUser,
  notifyAdminUserAction,
  notifyUserAdminAction
};
