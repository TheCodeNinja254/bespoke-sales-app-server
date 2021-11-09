const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const logMessages = require('../../logMessages/index');
const GetOAuthToken = require('./getOAuthToken');
const { decrypt } = require('../../common/encryptDecrypt');
const { redis } = require('../../Redis/index');

const configValues = config.parsed;

class ValidateOTP extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
    this.otp = '';
    this.deviceToken = '';
  }

  // Class overrides for intercepting fetches: adding custom headers
  willSendRequest(request) {
    request.accessToken = this.context.session.homeToken.accessToken;
    const { otp } = this;
    const { deviceToken } = this.context.session;
    headersConfig.prototype.verifyOTPHeaders(request, deviceToken, otp);
  }

  // OATH2 initialization
  async getHomeToken() {
    const getHomeToken = new GetOAuthToken();
    getHomeToken.initialize(this);
    await getHomeToken.getOauthToken();
    return null;
  }

  // Validate OTP resolver function
  async validateOTP(args) {
    let { otp } = args;
    otp = decrypt(otp);
    this.otp = Number(otp);

    // Ensure the OATH2 Token is set
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    // initializa the device token generated at sys login
    // Now we can validate OTP.
    const apiUrl = `${this.baseURL}/v1/4ghome/validate-otp`;
    const response = await this.get(
      apiUrl,
      {},
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );

    const { header: { responseCode, responseMessage, customerMessage } } = response;

    // Sys Logger function for validate-otp api call
    logMessages(response, 'verifyOTP', apiUrl);
    let status = false;
    if (responseCode === 200) {
      const message = 'allowed';
      status = true;
      const {
        body: {
          username, firstName, fullName, roleId, roleName, agencyId, agencyName, bearerToken,
        },
      } = response;
      const email = username.toLowerCase();
      // Init of the session: variable = user, full = user.email, note email is trimmed to retain the username part only
      // Set Data to Redis InMemory DB
      // Using DXL bearer Token as the Key. Unique to every user.
      await redis.set(bearerToken, Number(1));

      this.context.session.user = { email };

      /**
      * Define role and category for users at login.
      * */
      let role;
      // Config Values
      const salesRoles = configValues.SALES_ROLES.split(',');
      const adminRoles = configValues.ADMIN_ROLES.split(',');
      const shopDealerRoles = configValues.DEALER_SHOP_ROLES.split(',');

      // Determining view on front end
      if (salesRoles.includes(roleName)) {
        role = 'Sales';
      } else if (shopDealerRoles.includes(roleName)) {
        role = 'SalesManagement';
      } else if (adminRoles.includes(roleName)) {
        role = 'Admin';
      }

      // Swappable for Test: Developer, Sales, DealerAdmin
      // const role = 'Sales';
      this.context.session.userDetails = {
        firstName, fullName, email, bearerToken, role, userCategory: roleName, roleId, agencyId, agencyName,
      };

      Logger.log(
        'info',
        'Success: ',
        {
          message: 'Request Successful',
          request: 'signIn',
          technicalMessage: `OTP Verification Successful`,
          customerMessage,
        },
      );
      return {
        status,
        message,
        customerMessage,
        role: roleName,
      };
    } else {
      Logger.log(
        'error',
        'Error: ',
        {
          message: 'Request Failed',
          request: 'verifyOTP',
          technicalMessage: responseMessage,
          customerMessage,
        },
      );
      throw new Error(
        customerMessage,
      );
    }
  }
}

module.exports = ValidateOTP;
