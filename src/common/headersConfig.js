/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const _ = require('lodash');
const configValues = require('dotenv').config().parsed;
const uuid = require('uuid/v4');
const moment = require('moment');

// Some of the headers that are commonly used
const commonHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};


class HeadersConfig {
  // Generate headers for getting the bearer token
  homeOauthToken(request) {
    const headers = {
      Authorization: this.basicAuthHeader(
        `${configValues.CONSUMER_KEY}:${configValues.CONSUMER_SECRET}`,
      ),
    };

    // Account balance request needs common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Headers specific to Authentication Token
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }

  // Generate for the IPRS Validator
  iprsValidatorHeaders(request) {
    const headers = {
      Authorization: `Bearer ${request.accessToken}`,
    };

    // // Add common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Headers specific to the IPRS Validator
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }

  // Generate headers for apigee home api's
  homeHeaders(request) {
    const headers = {
      'Authorization': `Bearer ${request.accessToken}`,
      'X-Correlation-ConversationID': uuid(),
      'X-Identity': request.username,
      'X-MSISDN': '0110100420',
      'X-messageID': 'v7I5m/coazTYvz7gzXt1Hg|eKJEoNjhNNlurtAFScipaw|4EzkycIrr5VezD6x3Eyess',
      'Accept-Language': 'EN',
      'X-Source-System': '4g-home-web',
      'X-App': '4g-home-web',
      'X-Source-Operator': 'Safaricom',
    };

    // Add common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Add custom headers
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }

  technicalDebtHeaders(request) {
    const headers = {
      'Authorization': `Bearer ${request.accessToken}`,
      'X-Correlation-ConversationID': uuid(),
      'Accept': 'application/json',
      'X-Msisdn': '0715109743',
      'X-messageID': 'v7I5m/coazTYvz7gzXt1Hg|eKJEoNjhNNlurtAFScipaw|4EzkycIrr5VezD6x3Eyess',
      'X-Source-System': 'web-portal',
      'X-App': 'web-portal',
    };

    // Add common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Add custom headers
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }


  passphraseResetHeaders(request) {
    const headers = {
      'Authorization': `Bearer ${request.accessToken}`,
      'X-Correlation-ConversationID': uuid(),
      'Accept-Language': 'EN',
      'X-Source-System': 'home-4g-web',
      'X-Source-Operator': 'Safaricom',
    };

    // Add common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Add custom headers
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }


  // For Home APIs developed by Shadrack - to standardize the heders.
  locationHeaders(request) {
    const headers = {
      'Authorization': `Bearer ${request.accessToken}`,
      'X-Correlation-ConversationID': uuid(),
      'X-Identity': request.username,
      'X-Source-System': 'home-web-portal',
      'X-App': 'home-web-portal',
      'Accept-Encoding': 'application/json',
      'X-Source-Operator': 'Safaricom',
    };

    // Add common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Add custom headers
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }

  agenciesHeaders(request) {
    const headers = {
      'Authorization': `Bearer ${request.accessToken}`,
      'X-Correlation-ConversationID': uuid(),
      'X-DeviceId': uuid(),
      'X-DeviceToken': uuid(),
      'X-MessageID': uuid(),
      'X-Identity': request.username,
      'Accept-Language': 'EN',
      'Accept-Encoding': 'application/json',
      'X-Source-CountryCode': 'KE',
      'X-Source-Division': 'DE',
      'X-Source-Operator': 'Safaricom',
      'X-Source-System': 'mysafaricom-android',
      'X-Source-Timestamp': moment('YYYY-MM-DD HH:MM:SS'),
      'X-DeviceInfo': 'safasdfasdfas8df7asdfasd',
      'X-MSISDN': '0110100420',
      'X-App': ' MySafaricom App',
      'X-Version': '1.0.0',
    };

    // Add common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Add custom headers
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }

  userManagementHeaders(request) {
    const headers = {
      'Authorization': `Bearer ${request.accessToken}`,
      "Accept-Encoding": "application/json",
      "Accept-Language": "EN",
      "X-Source-CountryCode": "KE",
      "X-Source-Operator": "Safaricom",
      "X-Source-Division": "",
      "X-Source-System": "mysafaricom-android",
      "X-Source-Timestamp": moment('YYYY-MM-DD HH:MM:SS'),
      "X-Correlation-ConversationID": uuid(),
      "X-DeviceInfo": "safasdfasdfas8df7asdfasd",
      "X-DeviceId": "asdfasdfasiudfsdfhasdfhjkas",
      "X-DeviceToken": "asdfasdfasiudfsdfhasdfhjkas",
      "X-MSISDN": "0715109743",
      "X-App": "mysafaricom-android",
      "X-Version": "v1",
      "X-MessageID": "DNW5gSR9AovUyb9oflO4EgQWrTa2Jawg5A9YDMRjOSU=",
    };

    // Add common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Add custom headers
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }

  // Generate headers for apigee home api's
  authenticationHeaders(request) {
    const headers = {
      'Authorization': `Bearer ${request.accessToken}`,
      'x-correlation-conversationid': uuid(),
      'X-DeviceToken': 'gOXU75vJ0npsNlxA2YqiVED0pKsSkQ==|9894',
      'X-MessageID': request.messageId,
      'X-Source-System': 'home-4g-web-portal',
      'x-App': 'home-4g-web',
    };

    // Add common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Add custom headers
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }

  // Generate Headers for Validate OTP
  verifyOTPHeaders(request, deviceToken, otp) {
    const headers = {
      'Authorization': `Bearer ${request.accessToken}`,
      'x-correlation-conversationid': uuid(),
      'X-App': 'home-4g-web',
      'X-MessageID': 'oMX0z7vpFMyu8G7V',
      'X-DeviceID': 'Huawei',
      'X-Version': '1.0',
      'X-DeviceToken': `${deviceToken}|${otp}`,
      'X-Source-System': 'home-4g-web-portal',
    };

    // Add common headers
    _.forOwn(commonHeaders, (header, name) => {
      request.headers.set(name, header);
    });

    // Add custom headers
    _.forOwn(headers, (header, name) => {
      request.headers.set(name, header);
    });
  }


  // Helper function to generate a basic auth given username:password
  basicAuthHeader(credentials) {
    return `Basic ${Buffer.from(credentials)
      .toString('base64')}`;
  }
}

module.exports = HeadersConfig;
