const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const headersConfig = require('../../common/headersConfig');
const { redis } = require('../../Redis/index');
const Logger = require('../../common/logging');
const FormatPhoneNumber = require('../../common/formatPhoneNumber');
const logMessages = require('../../logMessages/index');
const GetOAuthToken = require("./getOAuthToken");
const { decrypt } = require('../../common/encryptDecrypt');

const configValues = config.parsed;

class EditUsersInfoAPI extends RESTDataSource {
  constructor() {
    super();
    this.signInError = 'Please sign in';
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
    this.sourceSystem = configValues.HOME_SOURCE_SYSTEM;
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

  async editUser(args) {
    const {
      input: {
        firstName,
        lastName,
        userMsisdn, // encrypted
        userName, // encrypted
        userRole,
        passedAgencyId,
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

    // Now we can add user
    try {
      const apiUrl = `${this.baseURL}/v1/technicalDebt/edit-user`;
      const response = await this.put(
        apiUrl,
        {
          username: decrypt(userName),
          parameters: [
            {
              paramName: "firstName",
              paramValue: firstName,
            },
            {
              paramName: "lastName",
              paramValue: lastName,
            },
            {
              paramName: "msisdn",
              paramValue: FormatPhoneNumber(decrypt(userMsisdn)),
            },
            {
              paramName: "userRole",
              paramValue: userRole,
            },
            {
              paramName: "agencyId",
              paramValue: passedAgencyId,
            },
          ],
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage }, details } = response;
      logMessages(response, 'editUser', apiUrl);
      let status = false;
      if (responseCode === 200) {
        status = true;
        const body = details;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Edit User Successful',
            request: 'editUser',
            technicalMessage: 'Edit User Successful',
            customerMessage,
          },
        );
        return {
          status,
          message: customerMessage,
          body,
        };
      } else {
        Logger.log(
          'info',
          'Error: ',
          {
            message: 'Edit User Failed',
            request: 'editUser',
            technicalMessage: 'Edit User Failed',
            customerMessage: 'Edit User Failed',
          },
        );
        return {
          status,
          message: customerMessage,
        };
      }
    } catch (e) {
      Logger.log(
        'info',
        'Error: ',
        {
          message: 'Edit User Failed',
          request: 'editUser',
          technicalMessage: e,
          customerMessage: 'Edit User Failed',
        },
      );
      const customerMessage = "Updating user info failed, kindly try again later!";
      throw new Error(
        customerMessage,
      );
    }
  }
}

module.exports = EditUsersInfoAPI;
