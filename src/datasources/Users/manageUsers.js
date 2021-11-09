const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const headersConfig = require('../../common/headersConfig');
const { redis } = require('../../Redis/index');
const Logger = require('../../common/logging');
const FormatPhoneNumber = require('../../common/formatPhoneNumber');
const logMessages = require('../../logMessages/index');
const GetOAuthToken = require("./getOAuthToken");
const { encrypt, decrypt } = require('../../common/encryptDecrypt');
const ErrorHandler = require('../../common/errorHandler');

const configValues = config.parsed;

class ManagerUsersAPI extends RESTDataSource {
  constructor() {
    super();
    this.signInError = 'Please sign in';
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
    this.sourceSystem = configValues.HOME_SOURCE_SYSTEM;
  }

  willSendRequest(request) {
    request.accessToken = this.context.session.homeToken.accessToken;
    request.username = this.context.session.username;
    headersConfig.prototype.userManagementHeaders(request);
  }

  async getHomeToken() {
    const getHomeToken = new GetOAuthToken();
    getHomeToken.initialize(this);
    await getHomeToken.getOauthToken();
    return null;
  }

  async createUser(args) {
    const {
      input: {
        firstName,
        lastName,
        userMsisdn, // encrypted
        docType,
        docNumber, // encrypted
        emailAddress, // encrypted
        userRole,
        passedAgencyId,
      },
    } = args;

    // Username = user email prefix before domain
    let emailDeciphered = decrypt(emailAddress);
    emailDeciphered = emailDeciphered.toLowerCase();
    const username = emailDeciphered.match(/^([^@]*)@/)[1];

    // Check user domain. AD anabled for safaricom.co.ke users
    // const userEmailDomain = emailDeciphered.split("@")[1];
    const sEmails=emailDeciphered.split("@");
    const domain=sEmails[1];
    let adEnabled;
    if (domain !== configValues.HOME_DOMAIN) {
      const reservedUserRoles = configValues.RESERVED_USER_ROLES.split(',');
      if (reservedUserRoles.includes(userRole)) {
        throw new Error(
          'Role reserved for Safaricom Domain users only',
        );
      } else {
        adEnabled = 0;
      }
    } else {
      adEnabled = 1;
    }


    // Setting Up Agency ID - Auth dependent on roles.
    let userAgencyId;
    const { agencyId } = this.context.session.userDetails;
    const { roleId } = this.context.session.userDetails;

    if (roleId === 1) {
      userAgencyId = passedAgencyId;
    } else {
      userAgencyId = agencyId;
    }

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
      const apiUrl = `${this.baseURL}/v1/4ghome/add-user`;
      const { email } = this.context.session.user;
      const response = await this.post(
        apiUrl,
        {
          firstName,
          lastName,
          userMsisdn: FormatPhoneNumber(decrypt(userMsisdn)),
          docType,
          docNumber: decrypt(docNumber),
          username,
          emailAddress: decrypt(emailAddress),
          userRole,
          agencyId: userAgencyId,
          requestedBy: email,
          adEnabled,
          sourceSystem: this.sourceSystem,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage }, details } = response;
      logMessages(response, 'createUser', apiUrl);
      let status = false;
      if (responseCode === 200) {
        status = true;
        const body = details;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'User Creation Successful',
            request: 'createUser',
            technicalMessage: 'User Creation Successful',
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
          'Success: ',
          {
            message: 'User Creation Failed',
            request: 'createCustomer',
            technicalMessage: 'User Creation Failed',
            customerMessage: 'User Creation Failed',
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
        'Success: ',
        {
          message: 'User Creation Failed',
          request: 'createCustomer',
          technicalMessage: e,
          customerMessage: 'User Creation Failed',
        },
      );
      const customerMessage = "User creation failed, ensure the email address is unique";
      throw new Error(
        customerMessage,
      );
    }
  }

  async updateUserStatus(args) {
    const {
      status,
      userName,
      msisdn, // encrypted
      emailAddress, // encypted
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
      const apiUrl = `${this.baseURL}/v1/4ghome/update-user`;
      const { email } = this.context.session.user;
      const response = await this.post(
        apiUrl,
        {
          status,
          username: decrypt(userName),
          msisdn: decrypt(msisdn), // encrypted
          emailAddress,
          requestedBy: email,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage }, details } = response;
      logMessages(response, 'updateUserStatus', apiUrl);
      let updateStatus = false;
      if (responseCode === 200) {
        updateStatus = true;
        const body = details;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Status Update Successful',
            request: 'updateUserStatus',
            technicalMessage: 'Status Update Successful',
            customerMessage,
          },
        );
        return {
          status: updateStatus,
          message: customerMessage,
          body,
        };
      } else {
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Status Update n Failed',
            request: 'updateUserStatus',
            technicalMessage: 'Status Update Failed',
            customerMessage: 'Status Update ',
          },
        );
        return {
          status: updateStatus,
          message: customerMessage,
        };
      }
    } catch (e) {
      Logger.log(
        'info',
        'Success: ',
        {
          message: 'Status Update ',
          request: 'updateUserStatus',
          technicalMessage: e,
          customerMessage: 'Status Update ',
        },
      );
      const customerMessage = "Status Update failed, please try again later";
      throw new Error(
        customerMessage,
      );
    }
  }

  async changePassword(args) {
    let {
      username, // encrypted
      currentPassword, // encrypted
      newPassword, // encrypted
    } = args;

    const email = decrypt(username);
    currentPassword = decrypt(currentPassword);
    newPassword = decrypt(newPassword);
    // eslint-disable-next-line prefer-destructuring
    username = email.match(/^([^@]*)@/)[1];
    username = username.toLowerCase();
    const sEmails=email.split("@");
    const domain=sEmails[1];
    if (domain === configValues.HOME_DOMAIN) {
      throw new Error(
        ErrorHandler('Password Change No Allowed'),
      );
    }

    // First we get the AccessToken
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    // Now we can add user
    try {
      const apiUrl = `${this.baseURL}/v1/4ghome/update-user-pass`;
      const response = await this.post(
        apiUrl,
        {
          username,
          currentPassword,
          password: newPassword,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage }, details } = response;
      logMessages(response, 'changePassword', apiUrl);
      let updateStatus = false;
      if (responseCode === 200) {
        updateStatus = true;
        const body = details;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Password Update Successful',
            request: 'changePassword',
            technicalMessage: 'Password Update Successful',
            customerMessage,
          },
        );
        return {
          status: updateStatus,
          message: customerMessage,
          body,
        };
      } else {
        Logger.log(
          'Error',
          'error: ',
          {
            message: 'Password change Failed',
            request: 'changePassword',
            technicalMessage: 'Change Password Failed',
            customerMessage: 'Password change Failed',
          },
        );
        return {
          status: updateStatus,
          message: customerMessage,
        };
      }
    } catch (e) {
      Logger.log(
        'Error',
        'error',
        {
          message: 'Password change failed',
          request: 'changePassword',
          technicalMessage: e,
          customerMessage: 'Password change failed',
        },
      );
      const customerMessage = "Password change failed, please try again later";
      throw new Error(
        customerMessage,
      );
    }
  }

  // eslint-disable-next-line consistent-return
  async getUsers() {
    // First we ensure the OAuth2 Token is set
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }
    // Then we check if the session is valid
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
      // Now we can get list of users
      const { email } = this.context.session.user;
      const { agencyId } = this.context.session.userDetails;

      const apiUrl = `${this.baseURL}/v1/4ghome/get-users`;
      const response = await this.post(
        apiUrl,
        {
          requestedBy: email,
          agencyId,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode } } = response;
      logMessages(response, 'getUsers', apiUrl);
      let getUsersStatus = false;
      if (responseCode === 200) {
        getUsersStatus = true;
        const getUsersCount = response.body.length;
        const users = response.body && Array.isArray(response.body) && response.body.length > 0
          ? response.body.map((user) => ManagerUsersAPI.usersReducer(user))
          : [];
        return {
          getUsersStatus,
          getUsersCount,
          users,
        };
      } else {
        return {
          getUsersStatus,
          getUsersCount: 0,
        };
      }
    } catch (e) {
      const customerMessage = `Sorry, we were unable to get a list of users.`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getUsers',
          technicalMessage: `Unable to get users List`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  async getAllUsers(args) {
    const { agencyId } = args;

    // First we ensure the OAuth2 Token is set
    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }
    // Then we check if the session is valid
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
      // Now we can get list of sales
      const { email } = this.context.session.user;

      // Not depenedent on userRole. For Admin.
      const apiUrl = `${this.baseURL}/v1/4ghome/get-users`;
      const response = await this.post(
        apiUrl,
        {
          requestedBy: email,
          agencyId: `${agencyId}`,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode } } = response;
      logMessages(response, 'getAllUsers', apiUrl);
      let getUsersStatus = false;
      if (responseCode === 200) {
        getUsersStatus = true;
        const getUsersCount = response.body.length;
        const users = response.body && Array.isArray(response.body) && response.body.length > 0
          ? response.body.map((user) => ManagerUsersAPI.usersReducer(user))
          : [];
        return {
          getUsersStatus,
          getUsersCount,
          users,
        };
      } else {
        return {
          getUsersStatus,
          getUsersCount: 0,
        };
      }
    } catch (e) {
      const customerMessage = `Sorry, we were unable to get a list of users.`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getAllUsers',
          technicalMessage: `Unable to get users List`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  static usersReducer(user) {
    return {
      id: user.id,
      agencyId: user.agencyId,
      adEnabled: user.adEnabled,
      firstName: user.firstName,
      userName: user.userName ? encrypt(user.userName) : null,
      lastName: user.lastName,
      fullname: `${user.firstName} ${user.lastName}`,
      docType: user.docType,
      docNumber: user.docNumber ? encrypt(user.docNumber) : null,
      msisdn: user.msisdn ? encrypt(user.msisdn) : null,
      createdBy: user.createdBy ? encrypt(user.createdBy) : null,
      status: user.status,
      createdOn: user.createdOn,
      role: user.userRole,
      updatedOn: user.updatedOn,
      passwordSetDate: user.passwordSetDate,
    };
  }
}

module.exports = ManagerUsersAPI;
