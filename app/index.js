const dhis2Util = require("../helpers/dhis2-util.helper");
const config = require("../config");
const serverUrl = config.sourceConfig.url;
const dataExtractor = require("./data-extractor");
const constantsHelper = require("../helpers/constants.helper");
const levelForDataProcessing = constantsHelper.constants.orgUnitLevelThree;
const logsHelper = require("../helpers/logs.helper");
const utilsHelper = require("../helpers/utils.helper");
const _ = require("lodash");
const statusHelper = require("../helpers/status.helper");
const dataProcessor = require("./data-processor");
const dataUploader = require("./data-uploader");
const filesManipulationHelper = require("../helpers/file-manipulation.helper");
const dirName = "files-folder";
const emailNotificationHelper = require("../helpers/email-notification.helper");
const summaryHelper = require("../helpers/summary.helper");
const { filter } = require("lodash");
const constants = constantsHelper.constants;
const appStatus = constants.appStatus;
async function startApp(commands) {
  const headers = await dhis2Util.getHttpAuthorizationHeader(
    config.sourceConfig.username,
    config.sourceConfig.password
  );
  try {
    await logsHelper.addLogs("INFO", "Fetching Community Councils", "startApp");
    await logsHelper.updateAppLogsConfiguration(
      headers,
      serverUrl,
      "INFO",
      "Fetching Community Councils",
      "startApp"
    );

    var orgUnitsForDataProcessing =
      await dataExtractor.getOrgUnitsForDataProcessing(
        headers,
        serverUrl,
        levelForDataProcessing
      );

    if (orgUnitsForDataProcessing && orgUnitsForDataProcessing.length) {
      let summaries = [];

      utilsHelper.updateProcessStatus(
        "Generating Primary and secondary UICs..."
      );
      await logsHelper.addLogs("INFO", "Generating Primary and secondary UICs");
      await logsHelper.updateAppLogsConfiguration(
        headers,
        serverUrl,
        "INFO",
        "Generating Primary and secondary UICs",
        "startApp"
      );

      let orgUnitIndex = 0;
      const uploadedPayloads = [];
      const responsesFromServer = [];

      for (const orgUnit of orgUnitsForDataProcessing) {
        orgUnitIndex = orgUnitIndex + 1;
        const orgUnitName = orgUnit && orgUnit.name ? orgUnit.name : "";
        const startDate = commands && commands.from ? commands.from : "";
        const endDate = commands && commands.to ? commands.to : "";

        utilsHelper.updateProcessStatus(
          `Generating primary and secondary UICs for tracked Entity instances in ${orgUnitName}: ${orgUnitIndex}`
        );
        await logsHelper.addLogs(
          "INFO",
          `Generating primary and secondary UICs for tracked Entity instances in ${orgUnitName}: ${orgUnitIndex}`,
          "App"
        );
        await logsHelper.updateAppLogsConfiguration(
          headers,
          serverUrl,
          "INFO",
          `Generating primary and secondary UICs for tracked Entity instances in ${orgUnitName}: ${orgUnitIndex}`,
          "App"
        );

        const payloads = await dataProcessor.getTrackedEntityPayloadsByOrgUnit(
          headers,
          serverUrl,
          orgUnit,
          startDate,
          endDate
        );

        uploadedPayloads.push(payloads);

        const response = await dataUploader.uploadUpdatedTEIS(
          headers,
          serverUrl,
          orgUnit,
          orgUnitName,
          payloads
        );

        responsesFromServer.push(response);

        await logsHelper.addLogs(
          "INFO",
          `Uploaded primary and secondary UICs for tracked Entity instances in ${orgUnitName}: ${orgUnitIndex}`,
          "App"
        );
        await logsHelper.updateAppLogsConfiguration(
          headers,
          serverUrl,
          "INFO",
          `Uploaded primary and secondary UICs for tracked Entity instances in ${orgUnitName}: ${orgUnitIndex}`,
          "App"
        );

        const summary = utilsHelper.generateSummary(
          payloads,
          response,
          orgUnit
        );
        summaries = [...summaries, ...summary];
      }

      await logsHelper.addLogs("INFO", `Saving uploaded payloads`, "App");

      await logsHelper.saveToTextFile(
        _.flattenDeep(uploadedPayloads),
        "uploaded-payloads"
      );

      await logsHelper.addLogs(
        "INFO",
        `Saving responses from the server`,
        "App"
      );

      await logsHelper.saveToTextFile(
        _.flattenDeep(responsesFromServer),
        "responses-from-server"
      );
      console.log("Generating summary...");
      await logsHelper.addLogs("INFO", "Generating summary...", "App");
      await logsHelper.updateAppLogsConfiguration(
        headers,
        serverUrl,
        "INFO",
        "Generating summary...",
        "App"
      );
      const sanitizedSummary =
        summaryHelper.generateSanitizedSummary(summaries);
      await filesManipulationHelper.writeToExcelFile(
        sanitizedSummary,
        `${dirName}/summary.xlsx`
      );
      await filesManipulationHelper.writeToExcelFile(
        summaries,
        `${dirName}/detailed-summary.xlsx`
      );
      console.log("Summary generated successfully");
      await logsHelper.addLogs("INFO", "Summary generated successfully", "App");
      await logsHelper.updateAppLogsConfiguration(
        headers,
        serverUrl,
        "INFO",
        "Summary generated successfully",
        "App"
      );

      await statusHelper.updateAppStatusConfiguration(headers, serverUrl, {
        appStatus: appStatus.appStatusOptions.stopped,
        timeStopped: new Date(),
      });

      console.log("Sending email notifications");
      await logsHelper.addLogs("INFO", "Sending email notifications", "App");
      await logsHelper.updateAppLogsConfiguration(
        headers,
        serverUrl,
        "INFO",
        "Sending email notifications",
        "App"
      );
      await sendEmailWithScriptStatus();

      await logsHelper.addLogs("INFO", `End an app`, "App");
      await logsHelper.updateAppLogsConfiguration(
        headers,
        serverUrl,
        "INFO",
        `End an app`,
        "App"
      );
    } else {
      await logsHelper.addLogs("INFO", "There is no Community Council present");
      console.log("There is no Community Council present");
      await logsHelper.addLogs("INFO", `End an app`, "App");
    }
  } catch (error) {
    console.log(error);
    await logsHelper.addLogs("ERROR", error.message || error, "startApp");
  }
}

async function sendEmailWithScriptStatus() {
  const message = `The script has finished successfully. Find the attached summary.`;
  const attachmentDir = `${dirName}/summary.xlsx`;
  emailNotificationHelper.sendEmailNotifications(message, attachmentDir);
}

module.exports = {
  startApp,
};
