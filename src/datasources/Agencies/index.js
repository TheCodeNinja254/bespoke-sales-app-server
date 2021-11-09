/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const logMessages = require('../../logMessages/index');
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const GetOAuthToken = require('../Users/getOAuthToken');
const { encrypt, decrypt } = require("../../common/encryptDecrypt");
const { redis } = require('../../Redis/index');

const configValues = config.parsed;

class AgenciesAPI extends RESTDataSource {
  constructor() {
    super();
    this.signInError = 'Please sign in';
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
    this.sourceSystem = configValues.HOME_SOURCE_SYSTEM;
  }

  willSendRequest(request) {
    request.accessToken = this.context.session.homeToken.accessToken;
    request.username = this.context.session.username;
    headersConfig.prototype.agenciesHeaders(request);
  }


  async getHomeToken() {
    const getHomeToken = new GetOAuthToken();
    getHomeToken.initialize(this);
    await getHomeToken.getOauthToken();
    return null;
  }

  // eslint-disable-next-line consistent-return
  async getAgencies() {
    // First we ensure the OAuth2 Token is set
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    if (!this.context.session.user) {
      throw new Error(this.signInError);
    }

    // Authentication Check
    const { bearerToken } = this.context.session.userDetails;
    const signInStatus = await redis.get(bearerToken, (err, reply) => reply);
    if (Number(signInStatus) === 0) {
      throw new Error(this.signInError);
    }

    try {
      // Now we can get list of agencies list
      const apiUrl = `${this.baseURL}/v1/4ghome/agencies`;
      const response = await this.get(
        apiUrl,
        { sourceSystem: this.sourceSystem },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage, responseMessage } } = response;
      logMessages(response, 'getAgencies', apiUrl);
      let getAgenciesStatus = false;
      if (responseCode === 200) {
        getAgenciesStatus = true;
        const agencies = response.body && Array.isArray(response.body) && response.body.length > 0
          ? response.body.map((agency) => AgenciesAPI.agenciesReducer(agency))
          : [];

        Logger.log(
          'error',
          'Error: ',
          {
            fullError: '',
            request: 'getAgencies',
            technicalMessage: responseMessage,
            customerMessage,
          },
        );

        return {
          getAgenciesStatus,
          agencies,
        };
      } else {
        Logger.log(
          'error',
          'Error: ',
          {
            fullError: '',
            request: 'getAgencies',
            technicalMessage: responseMessage,
            customerMessage,
          },
        );
        return {
          getAgenciesStatus,
          customerMessage,
        };
      }
    } catch (e) {
      const customerMessage = `Sorry, we were unable to get agencies`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getAgencies',
          technicalMessage: `Unable to get agencies`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  async createAgency(args) {
    const {
      input: {
        agencyName,
        agencyType,
        dealerCode,
        payBill,
        msisdn,
        bankName,
        bankAccountNumber,
      },
    } = args;

    // First we get the AccessToken
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    if (!this.context.session.user) {
      throw new Error(this.signInError);
    }

    // Authentication Check
    const { bearerToken } = this.context.session.userDetails;
    const signInStatus = await redis.get(bearerToken, (err, reply) => reply);
    if (Number(signInStatus) === 0) {
      throw new Error(this.signInError);
    }

    // Now we can create the agency
    const { email } = this.context.session.user;
    const apiUrl = `${this.baseURL}/v1/4ghome/agency`;
    const response = await this.post(
      apiUrl,
      {
        agencyName,
        agencyType,
        dealerCode: decrypt(dealerCode),
        payBill: decrypt(payBill),
        msisdn: decrypt(msisdn),
        bankName: decrypt(bankName),
        bankAccountNumber: decrypt(bankAccountNumber),
        createdBy: email,
        sourceSystem: this.sourceSystem,
      },
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    const { header: { responseCode, customerMessage, responseMessage } } = response;
    logMessages(response, 'createAgency', apiUrl);
    let addAgencyStatus = false;
    if (responseCode === 200) {
      const message = 'Agency added successfully';
      addAgencyStatus = true;
      Logger.log(
        'success',
        'Success: ',
        {
          message: 'Agency added successfully',
          request: 'createAgency',
          technicalMessage: 'Agency added successfully',
          customerMessage,
        },
      );
      return {
        status: addAgencyStatus,
        message,
      };
    } else {
      Logger.log(
        'error',
        'Failed: ',
        {
          message: 'Agency added failed',
          request: 'createAgency',
          technicalMessage: responseMessage,
          customerMessage,
        },
      );

      throw new Error(
        customerMessage,
      );
    }
  }


  static agenciesReducer(agency) {
    return {
      agencyId: Number(agency.agencyId),
      agencyName: agency.agencyName,
      agencyType: agency.agencyType,
      msisdn: agency.msisdn === null ? null : encrypt(agency.msisdn),
      dealerCode: agency.dealerCode === null ? null : encrypt(agency.dealerCode),
      payBill: agency.payBill === null ? null : encrypt(agency.payBill),
      bankName: agency.bankName === null ? null : encrypt(agency.bankName),
      bankAccount: agency.bankAccount === null ? null : encrypt(agency.bankAccount),
      createdBy: agency.createdBy === null ? null : encrypt(agency.createdBy),
    };
  }
}

module.exports = AgenciesAPI;
