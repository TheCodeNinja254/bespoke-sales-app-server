/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const getUserRoleInt = (userRole) => {
  let value = 2;
  if (userRole === "superAdmin") {
    value = 0;
  }
  if (userRole === "admin") {
    value = 1;
  }
  return value;
};

module.exports = getUserRoleInt;
