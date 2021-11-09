/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const GetPackageStatus = (timeStamp) => {
  const dueDate = new Date(timeStamp.replace(' ', 'T'));
  const currentDate = new Date();
  let status = "InActive";
  if (dueDate >= currentDate) {
    status = "Active";
  }
  return status;
};

module.exports = GetPackageStatus;
