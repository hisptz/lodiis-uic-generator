const config = require("../config");
const nodemailer = require("nodemailer");

const emailsToNotify = config.sourceConfig.emailsToNotify || "";
const serverUrl = config.sourceConfig.url || "";
const emailSender = config.emailSender;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "login",
    user: emailSender.email || "",
    pass: emailSender.password || "",
  },
});

function sendEmailNotifications(message, attachmentDir) {
  const instanceName = serverUrl;
  try {
    const mailOptions = {
      from: emailSender.email || "",
      to: emailsToNotify,
      subject: `KB UIC SCRIPT STATUS - ${instanceName}`.trim(),
      text: message,
      attachments: attachmentDir
        ? [
            {
              filename: "file.xlsx",
              path: attachmentDir,
            },
            ,
          ]
        : [],
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  sendEmailNotifications,
};
