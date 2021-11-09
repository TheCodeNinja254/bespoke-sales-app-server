const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const FormatPhoneNumber = require('../../common/formatPhoneNumber');
const logMessages = require('../../logMessages/index');
const GetOAuthToken = require('../Users/getOAuthToken');
const RoutersAPI = require('../Routers/index');
const IPRSValidatorAPI = require('./IPRSDetailsValidator');
const { decrypt } = require('../../common/encryptDecrypt');
const { redis } = require('../../Redis/index');

const configValues = config.parsed;

class CustomersAPI extends RESTDataSource {
  constructor() {
    super();
    this.signInError = 'Please sign in';
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
    this.appKey = configValues.HOME_APP_KEY;
    this.appProfile = configValues.HOME_APP_PROFILE;
    this.appVersion = configValues.HOME_APP_VERSION;
  }

  willSendRequest(request) {
    request.accessToken = this.context.session.homeToken.accessToken;
    request.username = this.context.session.username;
    headersConfig.prototype.homeHeaders(request);
  }

  async getHomeToken() {
    const getHomeToken = new GetOAuthToken();
    getHomeToken.initialize(this);
    await getHomeToken.getOauthToken();
    return null;
  }

  /**
   * Update Router Status Minimal is deprecated as at 8-08-2020.
   * Refer to update Router and Simex Serial number
   * */
  async updateRouterStatus(routerSerial, statusId) {
    const updateRouterStatus = new RoutersAPI();
    updateRouterStatus.initialize(this);
    await updateRouterStatus.updateRouterDeliveryMinimal(routerSerial, statusId);
    return null;
  }

  async validateData(docType, documentNumber, firstName, middleName, LastName, dateOfBirth) {
    const validateData = new IPRSValidatorAPI();
    validateData.initialize(this);
    await validateData.validateCustomerCredentials(docType, documentNumber, firstName, middleName, LastName, dateOfBirth);
    return null;
  }

  async createCustomer(args) {
    const {
      input: {
        firstName,
        middleName,
        lastName,
        sponsorMsisdn, // encrypted
        documentNumber, // encrypted
        docTypeId,
        emailAddress,
        benMsisdnSerialNumber,
        houseNumber,
        productId,
        estateId,
        routerSerial,
        dateOfBirth,
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

    // eslint-disable-next-line no-empty
    if (!(docTypeId === 2 || docTypeId === '2')) {
      await this.validateData(docTypeId, decrypt(documentNumber), firstName, middleName, lastName, dateOfBirth);
    }

    try {
      // Now we can register the customer
      // Sponsor and preferred MSISDN = Phone Numbers are encrypted
      // DocumentNumber = Encrypted
      const apiUrl = `${this.baseURL}/v1/4ghome/customer-registration`;
      const { email } = this.context.session.user;
      const response = await this.post(
        apiUrl,
        {
          firstName,
          middleName: middleName || "",
          lastName: lastName || "",
          sponsorMsisdn: FormatPhoneNumber(decrypt(sponsorMsisdn)),
          documentNumber: decrypt(documentNumber),
          docTypeId,
          emailAddress,
          benMsisdnSerialNumber: benMsisdnSerialNumber || "",
          houseNumber,
          productId,
          estateId,
          routerSerial: routerSerial || "",
          userId: email,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage, responseMessage }, body } = response;
      logMessages(response, 'registerCustomer', apiUrl);
      let status = false;
      if (responseCode === 200 && customerMessage === 'Customer Registration Successful') {
        const message = 'Details submitted for registration. You will receive an SMS once line registration is complete';
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
          message,
          body,
        };
      } else {
        Logger.log(
          'error',
          'Error: ',
          {
            message: 'Customer Registration Failed',
            request: 'createCustomer',
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
          message: 'Customer Registration Failed',
          request: 'createCustomer',
          fullError: e, // specific error message from the MS
          technicalMessage: 'Customer Registration Failed',
        },
      );
      throw new Error(
        "Customer registration failed, please try again later!",
      );
    }
  }

  // eslint-disable-next-line consistent-return
  async getMySales(args) {
    let {
      searchParam, searchValue,
    } = args;

    const {
      pageSize, page,
    } = args;

    searchParam = decrypt(searchParam);
    searchValue = decrypt(searchValue);

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
      const { email } = this.context.session.user;
      if (searchParam === '' || searchValue === '') {
        const apiUrl = `${this.baseURL}/v1/4ghome/get-sales?username=${email}&pageSize=${pageSize}&pageNo=${page}`;
        const response = await this.get(
          apiUrl,
          {},
          {
            agent: new https.Agent({
              rejectUnauthorized: false,
            }),
          },
        );
        const { header: { responseCode, customerMessage } } = response;
        logMessages(response, 'getSalesByUsername', apiUrl);
        if (responseCode === 200) {
          const getSalesDataStatus = true;
          const getSalesCount = response.body.totalElements;
          const sales = response.body.content && Array.isArray(response.body.content) && response.body.content.length > 0
            ? response.body.content.map((sale) => CustomersAPI.salesReducer(sale))
            : [];
          // Logging
          Logger.log(
            'success',
            'Success: ',
            {
              request: 'getSalesByUsername',
              apiUrl,
              technicalMessage: `List Fetched Successfully`,
              customerMessage,
            },
          );

          return {
            getSalesDataStatus,
            getSalesCount,
            sales,
          };
        }
      } else {
        const apiUrl = `${this.baseURL}/v1/4ghome/customer-search`;
        const response = await this.post(
          apiUrl,
          {
            parameterKey: searchParam,
            parameterValue: searchValue,
            pageNo: page - 1,
            pageSize,
          },
          {
            agent: new https.Agent({
              rejectUnauthorized: false,
            }),
          },
        );
        const { header: { responseCode, customerMessage } } = response;
        logMessages(response, 'searchSalesRecord', apiUrl);
        if (responseCode === 200) {
          const getSalesDataStatus = true;
          const getSalesCount = response.body.totalElements;
          const sales = response.body.content && Array.isArray(response.body.content) && response.body.content.length > 0
            ? response.body.content.map((sale) => CustomersAPI.salesReducer(sale))
            : [];
          // Logging
          Logger.log(
            'success',
            'Success: ',
            {
              request: 'searchSalesRecord',
              apiUrl,
              technicalMessage: `Search Successful`,
              customerMessage,
            },
          );

          return {
            getSalesDataStatus,
            getSalesCount,
            sales,
          };
        }
      }
    } catch (e) {
      const customerMessage = `Sorry, we were unable to get a list of customers.`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          apiUrl: `${this.baseURL}/v1/4ghome/get-sales?username`,
          request: 'getSalesByUsername',
          technicalMessage: `Unable to get Sales List`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  // SponsorMSISDN = Phone number is encrypted
  static salesReducer(sale) {
    return {
      registrationId: sale.registrationId,
      sponsorMsisdn: sale.sponsorMsisdn,
      routerSerialNumber: sale.routerSerialNumber,
      paymentStatus: sale.paymentStatus,
      productName: sale.productName,
      routerDeliveryStatus: sale.routerDeliveryStatus,
      saleDate: sale.saleDate,
      paymmentDate: sale.paymentDate,
      activationDate: sale.activationDate,
      createdBy: sale.createdBy,
      firstName: sale.firstName,
      lastName: sale.lastName,
      estateName: sale.estateName,
      houseNumber: sale.houseNumber,
      fullName: `${sale.firstName} ${sale.lastName} `,
      beneficiaryMsisdn: sale.beneficiaryMsisdn,
    };
  }
}

module.exports = CustomersAPI;
