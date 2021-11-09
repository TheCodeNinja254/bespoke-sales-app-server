/**
* Working Version 1.0.0
* Uses Encrypted Cipher as payload to the IPRSValidatorAPI
*/
const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const moment = require('moment');
const config = require('dotenv').config();
const convertKeys = require('../../common/convertKeys');
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const { payloadEncrypt } = require("./CustomIPRSEncryption");

const configValues = config.parsed;

class IPRSValidatorAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
    this.key = configValues.IPRS_ENCRYPTION_KEY;
  }

  willSendRequest(request) {
    request.accessToken = this.context.session.homeToken.accessToken;
    headersConfig.prototype.iprsValidatorHeaders(request);
  }

  async validateCustomerCredentials(docType, documentNumber, firstName, middleName, LastName, dateOfBirth) {
    // Date formatter
    const dob = moment(dateOfBirth).format('YYYYMMDD');

    // Encryption
    // First Convert payload to string - To meet IPRS Decryption requirement
    const customerDataString=`${"{\n"
          + `    "details": {\n`
          + `        "doc_type": "${docType}",\n`
          + `        "doc_number": "${documentNumber}",\n`
          + `        "first_name": "${firstName}",\n`
          + `        "middle_name": "${middleName}",\n`
          + `        "last_name": "${LastName}",\n`
          + `        "date_of_birth": "${dob}"\n`
          + `    }\n`
          + `}`
    }`;

    // For Use at UAT
    const customerDataRawJson = {
      details: {
        doc_type: docType,
        doc_number: documentNumber,
        first_name: firstName,
        middle_name: middleName,
        last_name: LastName,
        date_of_birth: dob,
      },
    };

    try {
      // Cipher - For Use at Prod
      const body = payloadEncrypt(customerDataString, this.key);

      // Customer data validation on IPRS
      const response = await this.post(
        `/v1/checks/iprs`,
        // body, // Encrypted Text
        customerDataRawJson, // Plain Text
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
        // eslint-disable-next-line prefer-const
      let { responseCode, responseDesc } = convertKeys(response);
      if (responseCode === "1000") {
        Logger.log(
          'success',
          `Success`,
          {
            message: responseDesc,
            request: 'validateCustomerDetails',
            clientIp: "Nil",
            // response, // for debugging purposes
            url: `${this.baseURL}/v1/checks/iprs`,
          },
        );
        return true;
      } else {
        Logger.log(
          'error',
          'Error: ',
          {
            fullError: response,
            customError: responseDesc,
            actualError: responseDesc,
            customerMessage: responseDesc,
          },
        );
        if (responseDesc === 'Please confirm Date of birth and retry (format yyyy-mm-dd or yyyymmdd).') {
          responseDesc = 'Please confirm date of birth and retry';
        }
        return new Error(
          responseDesc,
        );
      }
    } catch (e) {
      throw new Error(
        "Customer data validation failed, please try again later!",
      );
    }
  }
}

module.exports = IPRSValidatorAPI;
