const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const fs = require('fs');
const { createWriteStream } = require('fs');
const path = require("path");
const neatCsv = require('neat-csv');
const shortId = require('shortid');
const { redis } = require('../../Redis/index');
const logMessages = require('../../logMessages/index');
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const GetOAuthToken = require('../Users/getOAuthToken');

const configValues = config.parsed;

class RoutersAPI extends RESTDataSource {
  constructor() {
    super();
    this.signInError = 'Please sign in';
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
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

  async updateRouterDeliveryMinimal(routerSerial, statusId) {
    // Now we can update the router Delivery status after successful registration
    const apiUrl = `${this.baseURL}/v1/4ghome/update_deliverystatus`;
    const response = await this.post(
      apiUrl,
      {
        routerSerial,
        statusId,
      },
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    const { header: { responseCode, customerMessage, responseMessage } } = response;
    logMessages(response, 'updateRouterDeliveryStatusAfterReg', apiUrl);
    if (responseCode === 200) {
      const message = 'Router Delivery Status Updated Successfully';
      Logger.log(
        'info',
        'Success: ',
        {
          message: 'Router Delivery Status Updated Successfully',
          request: 'createCustomer',
          technicalMessage: responseMessage,
          customerMessage: message,
        },
      );
      return true;
    } else {
      throw new Error(
        customerMessage,
      );
    }
  }

  /**
  * @Deprecated
   * UpdateRouter delivery status deprecated on the 8th August 2020. Replaced by async function updateSimex to accept both
   * Router serial and Simex at registration.
   *
   * */
  async updateRouterDelivery(args) {
    const {
      input: {
        routerSerial,
        statusId,
      },
    } = args;

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

    // Now we can update the router Delivery status
    const apiUrl = `${this.baseURL}/v1/4ghome/update_deliverystatus`;
    const response = await this.post(
      apiUrl,
      {
        routerSerial,
        statusId,
      },
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    const { header: { responseCode, customerMessage, responseMessage }, details } = response;
    logMessages(response, 'updateRouterDeliveryStatus', apiUrl);
    let status = false;
    if (responseCode === 200) {
      const message = 'Router Delivery Status Updated Successfully';
      status = true;
      const body = details;
      Logger.log(
        'info',
        'Success: ',
        {
          message: 'Router Delivery Status Updated Successfully',
          request: 'createCustomer',
          technicalMessage: responseMessage,
          customerMessage: message,
        },
      );
      return {
        status,
        message,
        body,
      };
    } else {
      throw new Error(
        customerMessage,
      );
    }
  }

  async updateSimex(args) {
    const {
      input: {
        registrationId,
        routerSerialNumber,
        simexSerialNumber,
      },
    } = args;

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

    // Now we can update the router Delivery status
    const apiUrl = `${this.baseURL}/v1/4ghome/router-simex`;
    const response = await this.post(
      apiUrl,
      {
        registrationId: `${registrationId}`,
        routerSerialNumber,
        simexSerialNumber, // MSISDN Simex Serial Number
      },
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    const { header: { responseCode, customerMessage, responseMessage }, details } = response;
    logMessages(response, 'updateSimex&RouterSerial', apiUrl);
    let status = false;
    if (responseCode === 200) {
      const message = 'Sim & Router Serial updated successfully';
      status = true;
      const body = details;
      Logger.log(
        'info',
        'Success: ',
        {
          message: 'Sim & Router Serial updated successfully',
          request: 'updateSimex&Serial',
          technicalMessage: responseMessage,
          customerMessage: message,
        },
      );
      return {
        status,
        message,
        body,
      };
    } else {
      throw new Error(
        customerMessage,
      );
    }
  }

  async createFolder(folderPath) {
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        return true;
      }
      return true;
    } catch (e) {
      const customerMessage = `Sorry, we were unable to create a folder for your file`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'createFolder',
          technicalMessage: `Unable to create a folder with this path (${folderPath})`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  async uploadFile(createReadStream, filePath, filename, request, customerErrorMessage) {
    await new Promise((res) => createReadStream()
      .pipe(
        createWriteStream(
          path.join(__dirname, filePath, filename),
        ),
      )
      .on('error', (error) => {
        Logger.log(
          'error',
          'Error: ',
          {
            fullError: error,
            request,
            technicalMessage: customerErrorMessage,
            customerErrorMessage,
          },
        );
        throw new Error(customerErrorMessage);
      })
      .on("close", res));
  }

  async uploadRouters(args) {
    const {
      input: {
        routersFile,
        routerPrice,
      },
    } = args;

    if (!this.context.session.user) {
      throw new Error(this.signInError);
    }

    // Authentication Check
    const { bearerToken } = this.context.session.userDetails;
    const signInStatus = await redis.get(bearerToken, (err, reply) => reply);
    if (Number(signInStatus) === 0) {
      throw new Error(this.signInError);
    }

    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    // upload the release image and also resize it
    const fileData = await routersFile;
    await this.createFolder('uploads');
    const fileDir = 'uploads/publications';
    await this.createFolder(fileDir);
    const { createReadStream, filename } = await fileData[0];
    const newFileName = `${shortId.generate()}-${filename}`;

    const filePath = path.join(__dirname, fileDir, newFileName);
    await this.uploadFile(
      createReadStream,
      'uploads/publications',
      newFileName,
      'uploadRouters',
      'Oops! An error occurred while uploading the file.',
    );

    try {
      const data = fs.readFileSync(`${filePath}`, 'utf8');
      const routersContent = await neatCsv(data);

      // Adding the agencyId of user uploading the set of routers
      const { email } = this.context.session.user;
      const { agencyId } = this.context.session.userDetails;
      const routersContentResult = routersContent.map((el) => {
        const o = { ...el };
        o.agencyId = agencyId;
        o.routerPrice = routerPrice;
        return o;
      });

      // Logging the resultant object
      Logger.log(
        'info',
        'Success',
        {
          message: "Data Upload Successful",
          request: "DataRetrieval",
          info: "CSV Uploaded to uploads/publications successfully",
          callback: "uploadCSV",
          routers: routersContentResult,
          folder: "uploads/publications",
        },
      );
      const apiUrl = `${this.baseURL}/v1/4ghome/upload-router-api`;
      // Now we can upload the router data.
      const response = await this.post(
        apiUrl,
        {
          uploadedBy: email,
          routers: routersContentResult,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage, responseMessage } } = response;
      logMessages(response, 'uploadRouters', apiUrl);
      let status = false;
      if (responseCode === 200) {
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Routers Upload Successful',
            request: 'uploadRouters',
            technicalMessage: 'Routers Upload Successful',
            customerMessage,
          },
        );
        status = true;
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
            request: 'uploadRouters',
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
      const customerMessage = `Sorry, we were unable to upload the set of routers, ensure to include unique serials only!`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'uploadRouters',
          technicalMessage: e,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  async uploadSingleRouter(args) {
    const {
      input: {
        routerSerialNumber,
        routerModel,
        routerPrice,
        agencyId,
      },
    } = args;

    if (!this.context.session.user) {
      throw new Error(this.signInError);
    }

    // Authentication Check
    const { bearerToken } = this.context.session.userDetails;
    const signInStatus = await redis.get(bearerToken, (err, reply) => reply);
    if (Number(signInStatus) === 0) {
      throw new Error(this.signInError);
    }

    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    try {
      const apiUrl = `${this.baseURL}/v1/4ghome/upload-router-api`;
      // Now we can upload the router data.
      const { email } = this.context.session.user;

      let passedAgencyId;
      if (agencyId === -1 || agencyId === 0 || agencyId === '' || agencyId === null) {
        passedAgencyId = this.context.session.userDetails.agencyId;
      } else {
        passedAgencyId = agencyId;
      }

      const response = await this.post(
        apiUrl,
        {
          uploadedBy: email,
          routers: [
            {
              routerSerialNumber,
              routerModel,
              routerPrice,
              agencyId: passedAgencyId,
            },
          ],
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, responseMessage } } = response;
      let { header: { customerMessage } } = response;
      logMessages(response, 'uploadRouters', apiUrl);
      let status = false;
      if (responseCode === 200) {
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Single Routers Upload Successful',
            request: 'uploadSingleRouter',
            technicalMessage: 'Single Routers Upload Successful',
            customerMessage,
          },
        );
        status = true;
        if (customerMessage === 'Most Routers were uploaded, however the below listed routers already exist, they will not be uploaded.') {
          status = false;
          customerMessage = 'Router upload failed, please check the serial number and try again later';
        }
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
            request: 'uploadSingleRouter',
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
      const customerMessage = `Sorry, we were unable to upload the set of routers, ensure to include unique serials only!`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'uploadSingleRouter',
          technicalMessage: e,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  async uploadRoutersAdmin(args) {
    const {
      input: {
        routersFile,
        agencyId,
        routerPrice,
      },
    } = args;

    if (!this.context.session.user) {
      throw new Error(this.signInError);
    }

    // Authentication Check
    const { bearerToken } = this.context.session.userDetails;
    const signInStatus = await redis.get(bearerToken, (err, reply) => reply);
    if (Number(signInStatus) === 0) {
      throw new Error(this.signInError);
    }

    await this.getHomeToken();
    const { homeToken } = this.context.session;
    if (!homeToken) {
      throw new Error(
        "No token found",
      );
    }

    // upload the release image and also resize it
    const fileData = await routersFile;
    await this.createFolder('uploads');
    const fileDir = 'uploads/publications';
    await this.createFolder(fileDir);
    const { createReadStream, filename } = await fileData[0];
    const newFileName = `${shortId.generate()}-${filename}`;

    const filePath = path.join(__dirname, fileDir, newFileName);
    await this.uploadFile(
      createReadStream,
      'uploads/publications',
      newFileName,
      'uploadRouters',
      'Oops! An error occurred while uploading the file.',
    );

    try {
      const data = fs.readFileSync(`${filePath}`, 'utf8');
      const routersContent = await neatCsv(data);

      // Adding the agencyId of user uploading the set of routers
      const { email } = this.context.session.user;
      const routersContentResult = routersContent.map((el) => {
        const o = { ...el };
        o.agencyId = agencyId;
        o.routerPrice = routerPrice;
        return o;
      });

      // Logging the resultant object
      Logger.log(
        'info',
        'Success',
        {
          message: "Data Upload Successful",
          request: "DataRetrieval",
          info: "CSV Uploaded to uploads/publications successfully",
          callback: "uploadCSV",
          routers: routersContentResult,
          folder: "uploads/publications",
        },
      );
      const apiUrl = `${this.baseURL}/v1/4ghome/upload-router-api`;
      // Now we can upload the router data.
      const response = await this.post(
        apiUrl,
        {
          uploadedBy: email,
          routers: routersContentResult,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage, responseMessage } } = response;
      logMessages(response, 'uploadRouters', apiUrl);
      let status = false;
      if (responseCode === 200) {
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Routers Upload Successful',
            request: 'uploadRouters',
            technicalMessage: 'Routers Upload Successful',
            customerMessage,
          },
        );
        status = true;
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
            request: 'uploadRouters',
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
      const customerMessage = `Sorry, we were unable to upload the set of routers, ensure to include unique serials only!`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'uploadRouters',
          technicalMessage: e,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }


  // eslint-disable-next-line consistent-return
  async getRouters() {
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
      // Now we can get list of routers
      const { email } = this.context.session.user;
      const apiUrl = `${this.baseURL}/v1/4ghome/router_by_username?username=${email}`;
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
      logMessages(response, 'getRoutersByUsername', apiUrl);
      let getRouterStatus = false;
      if (responseCode === 200) {
        getRouterStatus = true;
        const routers = response.body.routers && Array.isArray(response.body.routers) && response.body.routers.length > 0
          ? response.body.routers.map((router) => RoutersAPI.routersReducer(router))
          : [];
        return {
          getRouterStatus,
          routers,
        };
      } else {
        return {
          getRouterStatus,
          customerMessage,
        };
      }
    } catch (e) {
      const customerMessage = `You do not have any routers uploaded. Please load some more via your admin`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getRouters',
          technicalMessage: `Unable to get routers list`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  // eslint-disable-next-line consistent-return
  async getRoutersDeliveryStatus(args) {
    const { routerSerial } = args;

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
      // Now we can get router delivery status
      const apiUrl = `${this.baseURL}/v1/4ghome/router_delivery_status?routerSerial=${routerSerial}`;
      const response = await this.get(
        apiUrl,
        {},
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode }, body: { deliveryStatus } } = response;
      logMessages(response, 'getRouterDeliveryStatus', apiUrl);
      if (responseCode === 200) {
        const getRoutersDeliveryStatus = true;
        return {
          getRoutersDeliveryStatus,
          deliveryStatus,
        };
      }
    } catch (e) {
      const customerMessage = `Sorry, we are unable to update the status`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getRouterDeliveryStatus',
          technicalMessage: `Unable to get routers delivery status`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }


  static routersReducer(router) {
    return {
      routerSerialNumber: router.routerSerialNumber,
      routerId: router.routerId,
      routerModel: router.routerModel,
      routerPrice: router.routerPrice,
      routerStatus: router.routerStatus,
    };
  }
}

module.exports = RoutersAPI;
