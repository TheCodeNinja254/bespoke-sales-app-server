const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
// const shortId = require('shortid');
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const logMessages = require('../../logMessages/index');
const GetOAuthToken = require('./getOAuthToken');
const { redis } = require('../../Redis/index');
const { decrypt } = require('../../common/encryptDecrypt');
// const { encryptSign, decryptSignedCipher } = require('../../common/ApiPayloadEncryption');

// returns values in the .env file
const configValues = config.parsed;

class HomeAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
    this.ikm = "";
    this.info = "";
    this.authenticationTag = "";
  }

  // override function for setting custom fetch headers. Intercepts below async/await functions
  willSendRequest(request) {
    request.accessToken = this.context.session.homeToken.accessToken;
    request.username = this.context.session.username;
    request.messageId = `${this.ikm}|${this.info}|${this.authenticationTag}`;
    headersConfig.prototype.authenticationHeaders(request);
  }

  // OAUTH2 initialization and setup
  async getHomeToken() {
    const getHomeToken = new GetOAuthToken();
    getHomeToken.initialize(this);
    await getHomeToken.getOauthToken();
    return null;
  }

  /**
   * @deprecated as at 6th August 2020
   * Password Encryption API.
   * Hits the endpoint with plain password for a cipher
   *
   * New API includes payload encryption not server rendered encryption
   * */
  async getEncryptedPassword(rawPassword, email) {
    // ensure we have the access token
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }
    // now we can get the password encrypted by the server.
    const apiUrl = `${this.baseURL}/v1/4ghome/encryption`;
    const response = await this.post(
      apiUrl,
      {
        appProfile: this.appProfile,
        appVersion: this.appVersion,
        appKey: this.appKey,
        payload: rawPassword,
      },
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    const { header: { responseCode, customerMessage }, body: details } = response;
    // Encryption api logger function
    logMessages(response, 'encryptPassword', apiUrl);
    if (responseCode === 200) {
      // now we return the encrypted password
      const encryptedPassword = details.payload;
      this.context.session.encryptedPassword = {
        encryptedPassword,
      };
      this.context.session.username = email;
      return true;
    } else {
      throw new Error(
        customerMessage,
      );
    }
  }

  async signIn(args) {
    let { email, password } = args;
    email = decrypt(email);
    email = email.toLowerCase();
    password = decrypt(password);
    // eslint-disable-next-line prefer-destructuring
    email = email.match(/^([^@]*)@/)[1];

    // Check OATH2 Token
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    // const dataPayload = {
    //   username: email,
    //   password,
    // };


    /*
   * generate random values
    */
    // this.ikm = shortId.generate();
    // this.info = shortId.generate();
    // this.authenticationTag = shortId.generate();

    this.ikm = 'HhehIs3kksIisL';
    this.info = 'suujNjhsn828Jns';
    this.authenticationTag = 'NjnJj88UN8NnmM9';
    // const serializedResponse = encryptSign(this.ikm, this.info, this.authenticationTag, JSON.stringify(dataPayload));

    // Now we can login.
    // now we can get the password encrypted by the server.
    const apiUrl = `${this.baseURL}/v1/4ghome/login`;
    const response = await this.post(
      apiUrl,
      {
        username: email,
        password,
      },
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    const { header: { responseCode, responseMessage, customerMessage } } = response;
    // Login API logger function
    logMessages(response, 'login', apiUrl);
    let status = false;
    if (responseCode === 200) {
      const message = 'allowed';
      const { body: { deviceToken } } = response;
      this.context.session.deviceToken = deviceToken;

      // Login status to client App
      status = true;
      Logger.log(
        'info',
        'Success: ',
        {
          message: 'Request Successful',
          request: 'signIn',
          technicalMessage: `${email} logged in successfully`,
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
          request: 'Login',
          technicalMessage: responseMessage,
          customerMessage: `Login Failed`,
        },
      );
      throw new Error(
        customerMessage,
      );
    }
  }

  async signOut() {
    const { bearerToken } = this.context.session.userDetails;
    if (await redis.set(bearerToken, Number(0))) {
      delete this.context.session.user;
      delete this.context.session.userDetails;
      delete this.context.session.homeToken.accessToken;
      delete this.context.session.username;
      delete this.context.session.encryptedPassword;
      delete this.context.session.deviceToken;

      return true;
    } else {
      return false;
    }
  }

  // Function to async calls by App on logged on user.
  // Null values redirect to login page. UserDetails stored as an object in this.context.session
  async getSignedInUser() {
    if (!this.context.session.user) {
      // its easier for the client to check this
      // in other cases, would have thrown an Authentication error
      return null;
    }

    const { bearerToken } = this.context.session.userDetails;
    const signInStatus = await redis.get(bearerToken, (err, reply) => reply);
    if (Number(signInStatus) === 0) {
      return null;
    }

    const { user: { userId } } = this.context.session;
    try {
      const { userDetails } = this.context.session;

      return {
        user: HomeAPI.userReducer(userDetails),
      };
    } catch (e) {
      const customerMessage = 'Sorry, we were unable to get your details';
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getSignedInUser',
          technicalMessage: `Unable to get details for user id (${userId})`,
          customerMessage,
        },
      );
      // return {
      //   user: false,
      // };
      throw new Error(customerMessage);
    }
  }

  // return user data
  static userReducer(userDetails) {
    return {
      firstName: userDetails.firstName,
      fullname: userDetails.fullName,
      email: userDetails.email,
      role: userDetails.role,
      roleId: userDetails.roleId,
      agencyId: userDetails.agencyId,
      agencyName: userDetails.agencyName,
      userCategory: userDetails.userCategory,
    };
  }
}

module.exports = HomeAPI;
