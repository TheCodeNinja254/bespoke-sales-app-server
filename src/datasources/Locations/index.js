const { RESTDataSource } = require('apollo-datasource-rest');
const https = require('https');
const config = require('dotenv').config();
const _ = require('lodash');
const fs = require('fs');
const { createWriteStream } = require('fs');
const path = require("path");
const neatCsv = require('neat-csv');
const shortId = require('shortid');
const logMessages = require('../../logMessages/index');
const headersConfig = require('../../common/headersConfig');
const Logger = require('../../common/logging');
const GetOAuthToken = require('../Users/getOAuthToken');
const { redis } = require('../../Redis/index');

const configValues = config.parsed;

class LocationsAPI extends RESTDataSource {
  constructor() {
    super();
    this.signInError = 'Please sign in';
    this.baseURL = configValues.HOME_APIGEE_ENDPOINT;
  }

  willSendRequest(request) {
    request.accessToken = this.context.session.homeToken.accessToken;
    request.username = this.context.session.user.email;
    headersConfig.prototype.locationHeaders(request);
  }


  async getHomeToken() {
    const getHomeToken = new GetOAuthToken();
    getHomeToken.initialize(this);
    await getHomeToken.getOauthToken();
    return null;
  }

  // eslint-disable-next-line consistent-return
  async getRegions() {
    // First we ensure the OAuth2 Token is set
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
    // Now we can get list of regions
    //   const apiUrl = `${this.baseURL}/v1/4ghome/region-list`;
      const apiUrl = `${this.baseURL}/v1/4ghome/regions`;
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
      logMessages(response, 'getRegions', apiUrl);
      let getRegionsStatus = false;
      if (responseCode === 200) {
        getRegionsStatus = true;
        const regions = response.body.content && Array.isArray(response.body.content) && response.body.content.length > 0
          ? response.body.content.map((region) => LocationsAPI.regionsReducer(region))
          : [];
        return {
          getRegionsStatus,
          regions,
        };
      } else {
        return {
          getRegionsStatus,
          customerMessage,
        };
      }
    } catch (e) {
      const customerMessage = `Sorry, we were unable to get regions`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getRegions',
          technicalMessage: `Unable to get regions`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  // eslint-disable-next-line consistent-return
  async getEstates(args) {
    // initialize variables

    const { zoneId, pageSize, pageNo } = args;

    // First we ensure the OAuth2 Token is set
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
      const apiUrl = `${this.baseURL}/v1/4ghome/estates-zone/${zoneId}?pageSize=${pageSize}&pageNo=${pageNo}`;
      // Now we can get list of estates
      const response = await this.get(
        apiUrl,
        {},
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode } } = response;
      logMessages(response, 'getEstates', apiUrl);
      let getEstatesStatus = false;
      if (responseCode === 200) {
        getEstatesStatus = true;
        const getEstatesCount = response.body.totalElements;
        const estates = response.body.content && Array.isArray(response.body.content) && response.body.content.length > 0
          ? response.body.content.map((estate) => LocationsAPI.estatesReducer(estate))
          : [];
        return {
          getEstatesStatus,
          getEstatesCount,
          estates,
        };
      } else {
        const customerMessage = `Sorry, we were unable to get estates list`;
        return {
          getEstatesStatus,
          customerMessage,
        };
      }
    } catch (e) {
      const customerMessage = `Sorry, we were unable to get estates list`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getRegions',
          technicalMessage: `Unable to get estates list`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  async getSingleEstates(args) {
    // initialize variables
    const { estateId } = args;

    // First we ensure the OAuth2 Token is set
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
      const apiUrl = `${this.baseURL}/v1/4ghome/estates/${estateId}`;
      // Now we can get list of estates
      const response = await this.get(
        apiUrl,
        {},
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode } } = response;
      logMessages(response, 'getSingleEstates', apiUrl);
      let getEstatesStatus = false;
      if (responseCode === 200) {
        getEstatesStatus = true;
        const estates = response.body;
        return {
          getEstatesStatus,
          estates,
        };
      } else {
        const customerMessage = `Sorry, the estate is unavailable`;
        return {
          getEstatesStatus,
          customerMessage,
        };
      }
    } catch (e) {
      const customerMessage = `Sorry, the estate is unavailable`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getEstate',
          technicalMessage: `Unable to get estate, `,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
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

  async uploadEstates(args) {
    const {
      input: {
        estatesFile,
        regionId,
        zoneId,
        status,
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
    const fileData = await estatesFile;
    await this.createFolder('uploads');
    const fileDir = 'uploads/estates';
    await this.createFolder(fileDir);
    const { createReadStream, filename } = await fileData[0];
    const newFileName = `${shortId.generate()}-${filename}`;

    const filePath = path.join(__dirname, fileDir, newFileName);
    await this.uploadFile(
      createReadStream,
      'uploads/estates',
      newFileName,
      'uploadRouters',
      'Oops! An error occurred while uploading the file.',
    );

    try {
      const data = fs.readFileSync(`${filePath}`, 'utf8');
      const estatesContent = await neatCsv(data);

      // Adding Statics while uploading Estates
      const estatesContentResult = estatesContent.map((el) => {
        const o = { ...el };
        o.status = status;
        o.contractorAgencyId = '3';
        o.oltName = '0';
        o.houseNumbers = '0';
        return o;
      });

      // Logging the resultant object
      Logger.log(
        'info',
        'Success',
        {
          message: "Data Upload Successful",
          request: "DataRetrieval",
          info: "CSV Uploaded to uploads/estates successfully",
          callback: "uploadCSV",
          routers: estatesContentResult,
          folder: "uploads/estates",
        },
      );
      const apiUrl = `${this.baseURL}/v1/4ghome/upload-estates`;
      // Now we can upload the estates data.
      const response = await this.post(
        apiUrl,
        {
          regionId,
          zoneId,
          estates: estatesContentResult,
        },
        {
          agent: new https.Agent({
            rejectUnauthorized: false,
          }),
        },
      );
      const { header: { responseCode, customerMessage, responseMessage } } = response;
      logMessages(response, 'uploadRouters', apiUrl);
      let uploadStatus = false;
      if (responseCode === 200) {
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Estates Upload Successful',
            request: 'uploadRouters',
            technicalMessage: 'Routers Upload Successful',
            customerMessage,
          },
        );
        uploadStatus = true;
        return {
          status: uploadStatus,
          message: customerMessage,
        };
      } else {
        Logger.log(
          'error',
          'Error: ',
          {
            message: 'Request Failed',
            request: 'uploadEstates',
            technicalMessage: responseMessage,
            customerMessage,
          },
        );
        return {
          status: uploadStatus,
          message: customerMessage,
        };
      }
    } catch (e) {
      const customerMessage = `Sorry, we were unable to upload the set of estates`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'uploadEstates',
          technicalMessage: e,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  async addEstate(args) {
    const {
      input: {
        estateName,
        regionId,
        status,
        contractorAgencyId,
        oltName,
        noOfHouses,
        occupancy,
        coordinates,
        houseNumbers,
        zoneId,
        tierNumber,
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

    // Now we can create the estate
    const apiUrl = `${this.baseURL}/v1/4ghome/add-estates`;
    const response = await this.post(
      apiUrl,
      {
        estateName,
        regionId,
        status,
        contractorAgencyId,
        oltName,
        noOfHouses,
        occupancy,
        coordinates,
        houseNumbers,
        zoneId,
        tierNumber,
      },
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    const { header: { responseCode, customerMessage }, details } = response;
    logMessages(response, 'addEstate', apiUrl);
    let addEstateStatus = false;
    if (responseCode === 200) {
      const message = 'Estate added successfully';
      addEstateStatus = true;
      const body = details;
      Logger.log(
        'info',
        'Success: ',
        {
          message: 'Estate added successfully',
          request: 'addEstate',
          technicalMessage: 'Estate added successfully',
          customerMessage: message,
        },
      );
      return {
        status: addEstateStatus,
        message,
        body,
      };
    } else {
      Logger.log(
        'info',
        'Failed: ',
        {
          message: 'Estate addition failed',
          request: 'addEstate',
          technicalMessage: 'Estate addition failed',
          customerMessage: "Estate addition failed",
        },
      );

      throw new Error(
        customerMessage,
      );
    }
  }

  async updateEstate(args) {
    const {
      input: {
        id,
        estateName,
        regionId,
        status,
        contractorAgencyId,
        oltName,
        noOfHouses,
        occupancy,
        coordinates,
        houseNumbers,
        zoneId,
        tierNumber,
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

    // Now we can create the estate
    const apiUrl = `${this.baseURL}/v1/4ghome/update-estates/${id}`;
    const response = await this.put(
      apiUrl,
      {
        estateName,
        regionId,
        status,
        contractorAgencyId,
        oltName,
        noOfHouses,
        occupancy,
        coordinates,
        houseNumbers,
        zoneId,
        tierNumber,
      },
      {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    try {
      const { header: { responseCode, customerMessage }, details } = response;
      logMessages(response, 'addEstate', apiUrl);
      let updateEstateStatus = false;
      if (responseCode === 200) {
        // const message = 'Estate updated successfully';
        updateEstateStatus = true;
        const body = details;
        Logger.log(
          'info',
          'Success: ',
          {
            message: 'Estate updated successfully',
            request: 'addEstate',
            technicalMessage: 'Estate updated successfully',
            customerMessage,
          },
        );
        return {
          status: updateEstateStatus,
          message: customerMessage,
          body,
        };
      } else {
        Logger.log(
          'info',
          'Failed: ',
          {
            message: 'Estate updated failed',
            request: 'addEstate',
            technicalMessage: 'Estate update failed',
            customerMessage: "Estate update failed",
          },
        );
        return {
          status: updateEstateStatus,
          message: customerMessage,
        };
      }
    } catch (e) {
      const customerMessage = 'Estate updated failed, please try again later!';
      Logger.log(
        'info',
        'Failed: ',
        {
          message: 'Estate updated failed',
          request: 'addEstate',
          technicalMessage: e,
          customerMessage: "Estate update failed",
        },
      );
      throw new Error(
        customerMessage,
      );
    }
  }

  // eslint-disable-next-line consistent-return
  async getZones(args) {
    // initialize variables
    const { regionId } = args;

    // First we ensure the OAuth2 Token is set
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
    // Now we can get list of regions
      const apiUrl = `${this.baseURL}/v1/4ghome/zones-region/${regionId}`;
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
      logMessages(response, 'getZones', apiUrl);
      let getZonesStatus = false;
      if (responseCode === 200) {
        getZonesStatus = true;
        const zones = response.body && Array.isArray(response.body) && response.body.length > 0
          ? response.body.map((zone) => LocationsAPI.zonesReducer(zone))
          : [];
        return {
          getZonesStatus,
          zones,
        };
      } else {
        return {
          getZonesStatus,
          customerMessage,
        };
      }
    } catch (e) {
      const customerMessage = `Sorry, we were unable to get zones`;
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'getZones',
          technicalMessage: `Unable to get zones`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  }

  static regionsReducer(regions) {
    return {
      regionId: regions.id,
      regionName: regions.regionName,
    };
  }


  static estatesReducer(estate) {
    return {
      estateId: estate.id,
      estateName: estate.estateName,
      regionId: estate.regionId,
      status: estate.status,
      contractorAgencyId: estate.contractorAgencyId,
      oltName: estate.oltName,
      noOfHouses: estate.noOfHouses,
      occupancy: estate.occupancy,
      coordinates: estate.coordinates,
      houseNumbers: estate.houseNumbers,
      zoneId: estate.zoneId,
      tierNumber: estate.tierNumber,
      createdBy: estate.createdBy,
      createdAt: estate.createdAt,
      updatedAt: estate.updatedAt,
      deletedAt: estate.deletedAt,
    };
  }

  static zonesReducer(zone) {
    return {
      id: zone.id,
      zoneName: zone.zoneName,
      assignedDealerId: zone.dealerCode,
      status: zone.activeStatus,
      createdAt: zone.createdAt,
    };
  }
}

module.exports = LocationsAPI;
