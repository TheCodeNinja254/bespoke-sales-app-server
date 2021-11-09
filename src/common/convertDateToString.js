/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const convertDateToString = (date) => {
  const newDate = new Date(date);
  const year = newDate.getFullYear();
  const month = (newDate.getMonth() + 1) < 10 ? `0${newDate.getMonth() + 1}` : newDate.getMonth() + 1;
  const day = newDate.getDate() < 10 ? `0${newDate.getDate()}` : newDate.getDate();
  return `${year}-${month}-${day}`;
};

module.exports = convertDateToString;
