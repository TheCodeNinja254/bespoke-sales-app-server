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
