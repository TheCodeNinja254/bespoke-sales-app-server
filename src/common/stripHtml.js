/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const stripHtml = (html) => html.toString().replace(/<[^>]*>?/g, '');

module.exports = stripHtml;
