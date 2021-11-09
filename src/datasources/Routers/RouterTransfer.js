const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const logMessages = require('../../logMessages/index');
const GetOAuthToken = require('../Users/getOAuthToken');
const { redis } = require('../../Redis/index');

const configValues = config.parsed;

class RouterTransferAPI extends RESTDataSource {
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

  async routerTransfer(args) {
    const {
      agencyId,
      serialNumber,
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
      const apiUrl = `${this.baseURL}/v1/technicalDebt/transferRouter`;
      const { email } = this.context.session.user;

      let passedAgencyId;
      if (agencyId === -1) {
        passedAgencyId = this.context.session.userDetails.agencyId;
      } else {
        passedAgencyId = agencyId;
      }

      // API Call
      const response = await this.put(
        apiUrl,
        {
          agencyId: passedAgencyId,
          serialNumber,
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
      logMessages(response, 'routerTransfer', apiUrl);
      let status = false;
      if (responseCode === 200) {
        status = true;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Router transferred successfully',
            request: 'routerTransfer',
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
            message: 'Router transfer failed',
            request: 'routerTransfer',
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
          message: 'Router transfer failed',
          request: 'routerTransfer',
          fullError: e, // specific error message from the MS
          technicalMessage: 'Router transfer failed',
        },
      );
      throw new Error(
        "Router transfer failed, please try again later!",
      );
    }
  }
}

module.exports = RouterTransferAPI;
