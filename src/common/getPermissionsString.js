const getPermissionsString = (value) => {
  let string = 'read';
  if (value === 0) {
    string = 'createReadDelete';
  }
  if (value === 1) {
    string = 'createRead';
  }
  return string;
};

module.exports = getPermissionsString;
