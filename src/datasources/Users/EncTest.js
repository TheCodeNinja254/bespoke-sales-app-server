/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

// const { RESTDataSource } = require('apollo-datasource-rest');
// const config = require('dotenv');
// const shortId = require('shortid');
// const ApigeeOauthToken = require('../ApigeeOuathToken/index');
// const headersConfig = require('../../common/headersConfig');
// const getMsisdn = require('../../common/getMsisdn');
// const logMessages = require('../../logMessages/index');
// const UserAgentData = require('../../common/userAgentData');
// const { encryptSign, decryptSignedCipher } = require('../../common/ApiPayloadEncryption');
//
// config.config();
// const configValues = process.env;
//
// class DataStretchAPI extends RESTDataSource {
//   constructor() {
//     super();
//     this.baseURL = configValues.APIGEE_BASE_URL;
//     this.ikm = "";
//     this.info = "";
//     this.authenticationTag = "";
//   }
//
//   async willSendRequest(request) {
//     // ensure token is available
//     await this.getApigeeToken();
//     if (!this.context.session.apigee) {
//       throw new Error(
//         "No token found",
//       );
//     }
//     const { apigee: { accessToken } } = this.context.session;
//     const mobileNumber = getMsisdn(this.context.clientHeaders);
//     const deviceData = UserAgentData(this.context.userAgent);
//     request.accessToken = accessToken;
//     request.messageId = `${this.ikm}|${this.info}|${this.authenticationTag}`;
//     headersConfig.prototype.dataStretchHeaders(request, mobileNumber, deviceData);
//   }
//
//   async didReceiveResponse(response, _request) { // after we get the response
//     const responseResult = {
//       header: { customerMessage: "", responseCode: 0, responseMesage: "" },
//       body: {},
//     };
//     const serializedResponse = await response.json();
//     if (!serializedResponse.response) {
//       if (serializedResponse.header) {
//         const { header: { customerMessage, responseCode, responseMessage } } = serializedResponse;
//         responseResult.header.customerMessage = customerMessage || "Sorry, we were unable to process this request";
//         responseResult.header.responseCode = responseCode || 900; // TODO review on error code to use here
//         responseResult.header.responseMessage = responseMessage || "Sorry, we did not get the response. Seems to be empty";
//       } else {
//         responseResult.header.customerMessage = "Sorry, we were unable to process this request";
//         responseResult.header.responseCode = 900; // TODO review on error code to use here
//         responseResult.header.responseMessage = "Sorry, we did not get the response. Seems to be empty";
//       }
//       return responseResult;
//     }
//     const responseHeaders = response.headers;
//
//     const messageIdHeader = responseHeaders.get('x-messageid');
//     if (!messageIdHeader) {
//       responseResult.header.customerMessage = "Sorry, we were unable to process this request";
//       responseResult.header.responseCode = 800; // TODO review on error code to use here
//       responseResult.header.responseMessage = "Sorry, we did not get the x-messageid header";
//       return responseResult;
//     }
//     // let's start decryption message
//     const splitMessageIdHeader = messageIdHeader.split("|");
//     const ikm = splitMessageIdHeader[0];
//     const info = splitMessageIdHeader[1];
//     const authenticationTag = splitMessageIdHeader[2];
//     // decipher serialised response
//     const decipheredText = decryptSignedCipher(ikm, info, authenticationTag, serializedResponse.response);
//     return JSON.parse(decipheredText);
//   }
//
//   async getApigeeToken() {
//     const getTheApigeeToken = new ApigeeOauthToken();
//     getTheApigeeToken.initialize(this);
//     await getTheApigeeToken.getOauthToken();
//     return null;
//   }
//
//   async getDataTarget() {
//     const mobileNumber = getMsisdn(this.context.clientHeaders);
//     if (!mobileNumber) {
//       throw new Error("Mobile Number not found");
//     }
//
//     const path = 'cbu/data-unlock/v1/target';
//     const dataPayload = {
//       msisdn: mobileNumber,
//     };
//     /*
//        * generate random values
//         */
//     this.ikm = shortId.generate();
//     this.info = shortId.generate();
//     this.authenticationTag = shortId.generate();
//     const serializedResponse = encryptSign(this.ikm, this.info, this.authenticationTag, JSON.stringify(dataPayload));
//     const response = await this.post(
//       path,
//       {
//         data: serializedResponse,
//       }, {
//         timeout: 15000,
//       },
//     );
//     const { header: { responseCode, customerMessage }, body } = response;
//     const apiUrl = `${this.baseURL}/${path}`;
//     const addedDetails = {
//       msisdn: mobileNumber,
//     };
//     logMessages(response, mobileNumber, 'getDataTarget', apiUrl, addedDetails);
//     if (responseCode === 200) {
//       const { bundle, bundlePrice } = body;
//       return {
//         bundle,
//         bundlePrice,
//       };
//     } else {
//       throw new Error(customerMessage);
//     }
//   }
// }
//
// module.exports = DataStretchAPI;
