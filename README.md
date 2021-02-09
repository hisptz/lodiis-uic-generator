[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# KB UIC GENERATOR

1.  [Introduction](#Introduction)

2.  [Pre-requiestes](#Pre-requiestes)

3.  [Get started with app](#Getstartedwithapp)

    3.1. [Installations](#Installations)

    3.2. [Configuration](#Configuration)

    3.2.1. [App configuration](#Appconfiguration)

    3.2.2. [Metadata configuration](#Metadataconfiguration)

4.  [Operations of script](#Operationsofscript)

    4.1. [Generation of UIC for all data](#ManualDataupload)

    4.1.1. [Manual data upload for all data](#Manualdatauploadforalldata)

    4.1.2. [Manual data upload for all data from given year](#Manualdatauploadforalldatafromgivenyear)


## 1. <a name='Introduction'></a>Introduction

Node script app for generating Unique Identifier Code(UIC) for AGYW, Caregiver and OVC in KB Lesotho instance.

## 2. <a name='Pre-requiestes'></a>Pre-requiestes

```
- Node 10+
- npm 6+
- git
```

## 3. <a name='Getstartedwithapp'></a>Get started with app

### 3.1. <a name='Installations'></a>Installations

Clone the app and install all app dependencies

```
git clone https://github.com/hisptz/kb-uic-generator.git
cd kb-uic-generator
npm install
```

### 3.2. <a name='Configuration'></a>Configuration

<!-- There are two configurations to be done for the smooth data sync from excel files to dhis 2 instance, which are app and metadata configurations. -->

#### 3.2.1. <a name='Appconfiguration'></a>App configuration

It includes configurations for connection between script to  DHIS2 instance. This configuration is in _config_ directory, create file and save as _server-config.js_ , its contents as in _server-config.example.js_ file within _config_ directory. See below sample

```
const sourceServer = {
  url: 'url_to_dhis_instance',
  username: 'username',
  password: 'password',
};

module.exports = {
  sourceServer,
};
```

<!-- #### 3.2.2. <a name='Metadataconfiguration'></a>Metadata configuration

It includes configuration to set data set and Organisation Unit information(district level, Facility Column Key and District Column Key) for the data to be uploaded. This configuration is in _config_ directory, create file and save as _meta-data-config.js_ , its contents as in _meta-data-config.example.js_ file within _config_ directory. See below sample

```
module.exports = {
  dataSet: 'data_set_id',
  organisationUnit: {
    districtLevel: 3,
    facilityColumnKey: 'facility_column_label',
    districtColumnKey: 'district_column_label',
  },
};

``` -->


##### Source files
In order for a script to run it needs a source excel file(s) which contains facilty data. Create a folder with a name _files-folder_ inside the project folder, then in _files-folder_ create a folder with a name _inputs_. In _files-folder_/_inputs_ folder you can now add your source fiiles. 


## 4. <a name='Operationsofscript'></a>Operations of script

Once all configuration has been done, we can start using the script. There are several command for generation of UICs. They can be achieved using _run-app.sh_ . But we recommend to use [screen](https://linuxize.com/post/how-to-use-linux-screen/) to do manual data upload as it takes time complete based on volume of data.


### 4.1. <a name='Generate'></a>Generate

Manual data upload can be for all data or for given year. 

#### 4.1.1. <a name='GenerateForAllUICs'></a>Generate for all available data

Within script directory run command below

```
./run-app.sh generate
```
or

```
node index.js generate
```


#### 4.1.2. <a name='Manualdatauploadforalldatafromgivenyear'></a>Manual data upload for all data from given year

Let say the year is _2018_, within script directory run command below

```
./run-app.sh 2018
```
