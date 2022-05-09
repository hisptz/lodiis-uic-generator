const shell = require("shelljs");
const config = require("../config");
const emailsToNotify = config.sourceConfig.emailsToNotify;

function sendEmailNotifications(message, attachmentDir) {
  shell.exec(
    `echo "${message}" | s-nail -s 'KB UIC Script status' ` +
      (attachmentDir ? `-a ${attachmentDir}` : "") +
      ` ${emailsToNotify}`
  );
}

module.exports = {
  sendEmailNotifications,
};
