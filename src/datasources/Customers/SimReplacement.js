const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const logMessages = require('../../logMessages/index');
const GetOAuthToken = require('../Users/getOAuthToken');
const { decrypt } = require('../../common/encryptDecrypt');
const { redis } = require('../../Redis/index');

const configValues = config.parsed;

class SimReplacementAPI extends RESTDataSource {
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

  async simReplacement(args) {
    const {
      input: {
        msisdn,
        iccid,
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
      // eslint-disable-next-line no-console
      console.log(decrypt(iccid));
      // eslint-disable-next-line no-console
      console.log(decrypt(msisdn));
      const apiUrl = `${this.baseURL}/v1/4ghome/simSwap`;
      const { email } = this.context.session.user;
      const response = await this.post(
        apiUrl,
        {
          msisdn: decrypt(msisdn),
          iccid: decrypt(iccid),
          username: email,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage, responseMessage }, body } = response;
      logMessages(response, 'simReplacement', apiUrl);
      // eslint-disable-next-line no-console
      console.log(response);
      let status = false;
      if (responseCode === 200) {
        status = true;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Customer Registration Successful',
            request: 'createCustomer',
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
            message: 'Customer Registration Failed',
            request: 'simReplacement',
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
          message: 'Sim Swap Failed',
          request: 'simReplacement',
          fullError: e, // specific error message from the MS
          technicalMessage: e,
          customerMessage: 'Request failed, please try again later!',
        },
      );
      return new Error(
        'Request failed, please try again later',
      );
    }
  }
}

module.exports = SimReplacementAPI;
