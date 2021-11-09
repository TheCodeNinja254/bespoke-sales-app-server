const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const logMessages = require('../../logMessages/index');
const GetOAuthToken = require('../Users/getOAuthToken');
const { decrypt } = require('../../common/encryptDecrypt');
const { redis } = require('../../Redis/index');
const stripHtml = require("../../common/stripHtml");

const configValues = config.parsed;

class UpdateCustomerInfoAPI extends RESTDataSource {
  constructor() {
    super();
    this.signInError = 'Please sign in';
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
  }

  willSendRequest(request) {
    request.accessToken = this.context.session.homeToken.accessToken;
    headersConfig.prototype.technicalDebtHeaders(request);
  }

  async getHomeToken() {
    const getHomeToken = new GetOAuthToken();
    getHomeToken.initialize(this);
    await getHomeToken.getOauthToken();
    return null;
  }

  async updateCustomerRouter(args) {
    const {
      input: {
        registrationId,
        serialNumber,
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

    try {
      const apiUrl = `${this.baseURL}/v1/technicalDebt/edit-router`;
      const { email } = this.context.session.user;
      const response = await this.put(
        apiUrl,
        {
          registrationId,
          serialNumber: decrypt(serialNumber),
          username: email,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage, responseMessage }, body } = response;
      logMessages(response, 'updateCustomerRouter', apiUrl);
      let status = false;
      if (responseCode === 200) {
        status = true;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Router details updated successfully',
            request: 'updateCustomerRouter',
            technicalMessage: responseMessage,
            customerMessage,
          },
        );
        return {
          status,
          message: customerMessage,
        };
      } else {
        Logger.log(
          'error',
          'Error: ',
          {
            message: 'Router serial number update failed',
            request: 'updateCustomerRouter',
            fullError: body, // specific error message from the MS
            technicalMessage: responseMessage,
            customerMessage,
          },
        );
        return {
          status,
          message: customerMessage,
        };
      }
    } catch (e) {
      Logger.log(
        'error',
        'Error: ',
        {
          customerMessage: 'Router serial number update failed',
          request: 'updateCustomerRouter',
          fullError: e, // specific error message from the MS
          technicalMessage: e,
        },
      );
      throw new Error(
        "Router serial number update failed",
      );
    }
  }

  async updateCustomerMsisdn(args) {
    const {
      input: {
        registrationId,
        sponsorMsisdn,
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

    const apiUrl = `${this.baseURL}/v1/technicalDebt/edit-customer`;
    const { email } = this.context.session.user;
    const response = await this.put(
      apiUrl,
      {
        registrationId,
        sponsorMsisdn: decrypt(sponsorMsisdn),
        username: email,
      },
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    const { header: { responseCode, customerMessage, responseMessage }, body } = response;
    logMessages(response, 'deleteRegRecord', apiUrl);
    let status = false;
    if (responseCode === 200) {
      status = true;
      Logger.log(
        'info',
        'Success: ',
        {
          message: 'Customer MSISDN updated successfully',
          request: 'updateCustomerMsisdn',
          technicalMessage: responseMessage,
          customerMessage,
        },
      );
      return {
        status,
        message: customerMessage,
      };
    } else {
      Logger.log(
        'error',
        'Error: ',
        {
          message: 'Customer MSISDN update failed',
          request: 'updateCustomerMsisdn',
          fullError: body, // specific error message from the MS
          technicalMessage: responseMessage,
          customerMessage,
        },
      );
      throw new Error(
        customerMessage,
      );
    }
  }

  async deleteRegRecord(args) {
    const {
      registrationId,
      reason,
    } = args;

    // Get Access Token
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    // Check logged in user session
    if (!this.context.session.user) {
      throw new Error(this.signInError);
    }

    // Authentication Check - Check session validity from Redis
    const { bearerToken } = this.context.session.userDetails;
    const signInStatus = await redis.get(bearerToken, (err, reply) => reply);
    if (Number(signInStatus) === 0) {
      throw new Error(this.signInError);
    }

    try {
      const apiUrl = `${this.baseURL}/v1/technicalDebt/deleteRegistration`;
      const { email } = this.context.session.user;

      // API Call
      const response = await this.delete(
        apiUrl,
        {
          registrationId,
          reason: stripHtml(reason),
          username: email,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );

      // response message
      const { header: { responseCode, customerMessage, responseMessage }, body } = response;
      logMessages(response, 'updateCustomerMsisdn', apiUrl);
      let status = false;
      if (responseCode === 200) {
        status = true;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Record deleted successfully',
            request: 'deleteRegRecord',
            technicalMessage: responseMessage,
            customerMessage,
          },
        );
        return {
          status,
          message: customerMessage,
        };
      } else {
        Logger.log(
          'error',
          'Error: ',
          {
            message: 'Record deletion failed',
            request: 'deleteRegRecord',
            fullError: body, // specific error message from the MS
            technicalMessage: responseMessage,
            customerMessage,
          },
        );
        return new Error(
          customerMessage,
        );
      }
    } catch (e) {
      Logger.log(
        'error',
        'Error: ',
        {
          message: 'Record deletion failed',
          request: 'deleteRegRecord',
          fullError: e, // specific error message from the MS
          technicalMessage: 'Record deletion failed',
        },
      );
      throw new Error(
        "The record could not be deleted, please try again later!",
      );
    }
  }
}

module.exports = UpdateCustomerInfoAPI;
