[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# LODIIS UIC GENERATOR

1.  [Introduction](#Introduction)

2.  [Pre-requiestes](#Pre-requiestes)

3.  [Get started with app](#Getstartedwithapp)

    3.1. [Installations](#Installations)

    3.2. [Configuration](#Configuration)

    3.2.1. [App configuration](#Appconfiguration)

    3.2.2. [Metadata configuration](#Metadataconfiguration)

4.  [Operations of script](#Operationsofscript)

    4.1. [Generate](#Generate)

    4.1.1. [Generate for all data](#GenerateForAllUICs)

    4.1.2. [Generate UIC for beneficiary updated in a specific time](#GenerateForSpecificTime)
    4.2. [Auto](#Auto)
    4.3. [Update status](#Update)

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
git clone https://github.com/hisptz/lodiis-uic-generator.git
cd lodiis-uic-generator
npm install
```

### 3.2. <a name='Configuration'></a>Configuration

There are two configurations to be done for the smooth generation of UICs for the benefeciaries in KB Lesotho DHIS2 instance, which are app and metadata configurations.

#### 3.2.1. <a name='Appconfiguration'></a>App configuration

It includes configurations for connection between script to DHIS2 instance. This configuration is in _config_ directory, create file and save as _server-config.js_ , its contents as in _server-config.example.js_ file within _config_ directory. See below sample

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

#### 3.2.2. <a name='Metadataconfiguration'></a>Metadata configuration

It includes configuration to set metadata ids for the fields and programs which are required. This configuration is in _config_ directory, create file and save as _metadata-config.js_ , its contents as in _metadata-config.example.js_ file within _config_ directory. See below sample

```
const programTypes = {
  caregiver: "CG",
  ovc: "OVC",
  dreams: "DRM",
  bursary: "BUR",
  lbse: "LB",
};

const metadata = {
  firstname: "<firstname_metadata_id>",
  surname: "<surname_metadata_id>",
  primaryUIC: "<primaryUIC_metadata_id>",
  secondaryUIC: "<secondaryUIC_metadata_id>",
  age: "<age_metadata_id>",
};

const programs = [
  {
    id: "<program-id>",
    type: "<program-type-as-referred-above>", // programTypes.bursary,
    isChild: "<true_if_it_is_child_and_false_if_not>",
  },
  {
    id: "<program-id>",
    childProgram: {
      id: "<id_of_program_with_child_with_this_program>", //Example: ovc
      type: "<type_of_child_program>", // programTypes.ovc,
    },
    type: "<type_of_program>", // programTypes.caregiver,
  },
  {
    id: "<program-id>",
    type: "<type_of_program>", // programTypes.ovc,
    isChild: "<true_if_it_is_child_and_false_if_not>",
  },
];

module.exports = {
  metadata,
  programs,
  programTypes,
};

module.exports = {
  metadata,
  programs,
};

```

##### Source programs

In order for a script to run it needs ids for the program required to generate UICs for it tracked entity instances.

## 4. <a name='Operationsofscript'></a>Operations of script

Once all configuration has been done, we can start using the script. There are several command for generation of UICs. They can be achieved using _run-app.sh_ . But we recommend to use [screen](https://linuxize.com/post/how-to-use-linux-screen/) to do manual data upload as it takes time complete based on volume of data. There are three types of actions Generate, auto and update

### 4.1. <a name='Generate'></a>Generate

UICs can be generated for all beneficiaries without UICs or by specific dates of beneficiaries updated. All of these can be specified in a comaand.

#### 4.1.1. <a name='GenerateForAllUICs'></a>Generate for all available data in programs

Within script directory run command below

```
./run-app.sh generate
```

or

```
node index.js generate
```

#### 4.1.2. <a name='GenerateForSpecificTime'></a>Generate UIC for beneficiary updated in a specific time

Within script directory run command below

```
./run-app.sh generate from [START_DATE(YYYY-MM-DD)] to [END_DATE(YYYY-MM-DD)]
```

or

```
node index.js generate from [START_DATE(YYYY-MM-DD)] to [END_DATE(YYYY-MM-DD)]
```

###### Example

```
./run-app.sh generate from 2021-01-21 to 2021-02-10
```

or

```
node index.js generate from 2021-01-21 to 2021-02-10
```

This command will generate UICs for all beneficiaries who have been updated from **2021-01-21 to 2021-02-10**

### 4.2. <a name='Auto'></a>Auto

When you specify _auto_ action in a command the command will generate UICs for data in a week period.

###### Example

```
./run-app.sh generate auto
```

or

```
node index.js generate auto
```

This command will generate UICs for all beneficiaries who have been updated from **in a week period**

### 4.3. <a name='Update'></a>Update Status

Status of the script can be updated using update action. When you specify _update_ action in a command you should also specify word _status_ and type of status. This action is useful when the script has been terminated manually, so this action can be run to update status manually.
Available statuses are:
Status | Desciption
------------- | -------------
STOPPED | Script has been stopped
RUNNING | Script is running
UNDER_MAINTENANCE | Script is under maintenance

```
./run-app.sh update status [STATUS]
```

or

```
node index.js update status [STATUS]
```

###### Example

```
./run-app.sh update status STOPPED
```

or

```
node index.js update status STOPPED
```

This command will update status of the script to **STOPPED**
