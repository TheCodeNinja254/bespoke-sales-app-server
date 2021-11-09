
const DateFromString = (timeStampString) => {
  const stringSpread = [...timeStampString];
  const year = `${stringSpread[0]}${stringSpread[1]}${stringSpread[2]}${stringSpread[3]}`;
  const month = `${stringSpread[4]}${stringSpread[5]}`;
  const day = `${stringSpread[6]}${stringSpread[7]}`;
  const hour = `${stringSpread[8]}${stringSpread[9]}`;
  const min = `${stringSpread[10]}${stringSpread[11]}`;
  return new Date(`${year}-${month}-${day}T${hour}:${min}:00+03:00`);
};
module.exports = DateFromString;
