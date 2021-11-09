const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const logMessages = require('../../logMessages/index');
const GetOAuthToken = require('./getOAuthToken');
const { decrypt } = require('../../common/encryptDecrypt');

// returns values in the .env file
const configValues = config.parsed;

class PasswordManagement extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
  }

  // override function for setting custom fetch headers. Intercepts below async/await functions
  willSendRequest(request) {
    request.accessToken = this.context.session.homeToken.accessToken;
    request.username = this.context.session.username;
    headersConfig.prototype.passphraseResetHeaders(request);
  }

  // OAUTH2 initialization and setup
  async getHomeToken() {
    const getHomeToken = new GetOAuthToken();
    getHomeToken.initialize(this);
    await getHomeToken.getOauthToken();
    return null;
  }

  /**
     * Func used for OTP generation for password reset. A code is sent to a user
     */

  async generateOTP(args) {
    const { email } = args;
    // Username = user email prefix before domain
    let emailDeciphered = decrypt(email);
    emailDeciphered = emailDeciphered.toLowerCase();
    const username = emailDeciphered.match(/^([^@]*)@/)[1];

    // Check user domain. AD anabled for safaricom.co.ke users
    // const userEmailDomain = emailDeciphered.split("@")[1];
    const sEmails=emailDeciphered.split("@");
    const domain=sEmails[1];
    if (domain === configValues.HOME_DOMAIN) {
      throw new Error(
        'Password change not allowed for this user. Press (CTRL + ALT + DEL) to change your Windows password',
      );
    }

    // Check OATH2 Token
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    try {
      const apiUrl = `${this.baseURL}/v1/ftth-los/generateOtp`;
      const response = await this.post(
        apiUrl,
        {
          username,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage, responseMessage } } = response;
      // Login API logger function
      logMessages(response, 'resetPassword', apiUrl);
      let status = false;
      let message = 'You have reached the limit of generating OTP for this number. Please retry after 15 minutes.';
      if (responseCode === 200) {
        message = 'passChangeAllowed';
        status = true;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Request Successful',
            request: 'generateOTP',
            technicalMessage: responseMessage,
            customerMessage,
          },
        );
        return {
          status,
          message,
        };
      } else if (responseCode === 400) {
        status = false;
        message = 'You have reached the limit of generating OTP for this number. Please retry after 15 minutes.';
        Logger.log(
          'error',
          'Error: ',
          {
            message: 'Request Failed',
            request: 'generateOTP',
            technicalMessage: responseMessage,
            customerMessage: message,
          },
        );
        return {
          status,
          message,
        };
      } else {
        Logger.log(
          'error',
          'Error: ',
          {
            message: 'Request Failed',
            request: 'generateOTP',
            technicalMessage: responseMessage,
            customerMessage,
          },
        );
        return {
          status,
          message,
        };
      }
    } catch (e) {
      Logger.log(
        'error',
        'Error: ',
        {
          message: 'Request Failed',
          request: 'passwordReset',
          technicalMessage: e,
          customerMessage: 'You have reached the limit of generating OTP for this number. Please retry after 15 minutes.',
        },
      );
      throw new Error(
        "You have reached the limit of generating OTP for this number. Please retry after 15 minutes.",
      );
    }
  }

  async resetPassword(args) {
    let { username } = args;
    const { passphrase, otp } = args;

    // Username = user email prefix before domain
    let emailDeciphered = decrypt(username);
    emailDeciphered = emailDeciphered.toLowerCase();
    // eslint-disable-next-line prefer-destructuring
    username = emailDeciphered.match(/^([^@]*)@/)[1];

    // Check user domain. AD anabled for safaricom.co.ke users
    // const userEmailDomain = emailDeciphered.split("@")[1];
    const sEmails = emailDeciphered.split("@");
    const domain = sEmails[1];
    if (domain === configValues.HOME_DOMAIN) {
      throw new Error(
        'Password change not allowed for this user. Press (CTRL + ALT + DEL) to change your Windows password',
      );
    }

    // Check OATH2 Token
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    try {
      const apiUrl = `${this.baseURL}/v1/ftth-los/validateOtp`;
      const response = await this.post(
        apiUrl,
        {
          username,
          passphrase: decrypt(passphrase),
          otp: decrypt(otp),
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage, responseMessage } } = response;
      // Login API logger function
      logMessages(response, 'resetPassword', apiUrl);
      let status = false;
      if (responseCode === 200) {
        status = true;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Request Successful',
            request: 'generateOTP',
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
            message: 'Request Failed',
            request: 'generateOTP',
            technicalMessage: responseMessage,
            customerMessage,
          },
        );
        return {
          status: false,
          message: customerMessage,
        };
      }
    } catch (e) {
      throw new Error(
        "Request failed, please try again later.",
      );
    }
  }
}

module.exports = PasswordManagement;
