const _ = require('lodash');
const fs = require('fs');
const shelljs = require('shelljs');
const Promise = require('promise');
const logsHelper = require('./logs.helper');
const XLSX = require('xlsx');
const FileSaver = require('file-saver');
const EXCEL_EXTENSION = '.xlsx';

const fileDir = 'files-folder';

function getFileNamesFromDirectories(dir) {
  dir = `${fileDir}/${dir}`;
  const fileResponse = shelljs.ls(`${dir}`);
  return _.filter(fileResponse.stdout.split(`\n`), (name) => name !== '');
}

function intiateFilesDirectories(directories) {
  return new Promise((resolve, reject) => {
    const response = shelljs.mkdir('-p', directories);
    if (response && !response.stderr) {
      resolve();
    } else {
      reject(response.stderr);
    }
  });
}

function writeToFile(dir, filename, data, shouldStringify = true, flag = 'w') {
  dir = `${fileDir}/${dir}`;
  if (!fs.existsSync(dir)) {
    intiateFilesDirectories(dir);
  }
  return new Promise((resolve, reject) => {
    data = shouldStringify ? JSON.stringify(data) : data;
    filename = getSanitizedFileName(filename);
    fs.writeFile(`${dir}/${filename}.txt`, data, { flag }, async (error) => {
      if (error) {
        console.log(JSON.stringify({ error, type: 'writeToFile' }));
      } else {
        resolve();
      }
    });
  });
}

async function readDataFromFile(dir, filename) {
  dir = `${fileDir}/${dir}`;
  let data = [];
  filename = getSanitizedFileName(filename);
  return new Promise((resolve) => {
    fs.readFile(`${dir}/${filename}.txt`, (error, response) => {
      if (error) {
        console.log(JSON.stringify({ error, type: 'readDataFromFile' }));
      } else {
        data = JSON.parse(response);
      }
      resolve(data);
    });
  });
}

async function writeMappedFormDataToTheFile(dir, formMapping) {
  const filenames = Object.keys(formMapping);
  try {
    for (let filename of filenames) {
      const data = formMapping[filename];
      await writeToFile(dir, filename, data);
    }
  } catch (error) {
    await logsHelper.addLogs(
      'ERROR',
      error.message || error,
      'writeMappedFormDataToTheFile'
    );
  } finally {
    await writeToFile(dir, 'Form name', { data: filenames });
  }
}

function getSanitizedFileName(filename) {
  filename = _.join(
    _.filter(filename.split('/'), (key) => key.trim() !== ''),
    '_'
  );
  return _.join(
    _.filter(filename.split(' '), (key) => key.trim() !== ''),
    '_'
  );
}
// async function exportAsExcelFile(json, excelFileName) {
//   return new Promise((resolve, reject) => {
//     try {
//       const worksheet = XLSX.utils.json_to_sheet(json);
//       const workbook = {
//         Sheets: { data: worksheet },
//         SheetNames: ['data'],
//       };
//       const excelBuffer = XLSX.write(workbook, {
//         bookType: 'xlsx',
//         type: 'array',
//       });
//       resolve();
//       saveAsExcelFile(excelBuffer, excelFileName);
//     } catch (error) {
//       reject(error);
//     }
//   });
// }
// async function saveAsExcelFile(buffer, fileName) {
//   try {
//     const data = new Blob([buffer], { type: EXCEL_TYPE });
//     FileSaver.saveAs(
//       data,
//       fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION,
//     );
//   } catch (e) {
//     throw e;
//   }
// }
async function writeToExcelFile(jsonData, filePath) {
  try {
    const ws = XLSX.utils.json_to_sheet(jsonData, {
      header: _.uniq(_.flattenDeep(_.map(jsonData, (data) => _.keys(data)))),
    });
    let workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, 'beneficiary list');
    XLSX.writeFile(workbook, filePath);
  } catch (error) {
    console.log(error);
    // await logsHelper.addLogs(
    //   'error',
    //   error.message || error,
    //   'writeToExcelFile'
    // );
  }
}

module.exports = {
  intiateFilesDirectories,
  writeMappedFormDataToTheFile,
  readDataFromFile,
  writeToFile,
  fileDir,
  getFileNamesFromDirectories,
  writeToExcelFile
};
