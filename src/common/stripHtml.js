const stripHtml = (html) => html.toString().replace(/<[^>]*>?/g, '');

module.exports = stripHtml;
