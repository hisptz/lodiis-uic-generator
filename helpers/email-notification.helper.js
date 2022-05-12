const shell = require("shelljs");
const config = require("../config");
const emailsToNotify = config.sourceConfig.emailsToNotify ?? "";

function sendEmailNotifications(message, attachmentDir) {
  const command =
    `echo "${message}" | s-nail -s 'KB UIC Script status' ` +
    (attachmentDir ? `-a ${attachmentDir}` : "") +
    ` ${emailsToNotify}`;
  shell.exec(command);
}

module.exports = {
  sendEmailNotifications,
};
