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
