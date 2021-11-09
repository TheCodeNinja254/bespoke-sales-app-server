const Jimp = require('jimp');
const Logger = require('./logging');

async function imageManipulation(imagePath, width, height) {
  /*
    * With the tight deadlines, I came up with a basic function to resize the images that accepts:
    * width
    * height
    * As we continue to improve the portal, this definitely needs to be improved
    * resized images will be saved in the resized folder. Please do not change the resized folder for now.
     */
  // TODO allow passing methods, crop, resize, contain e.t.c
  // TODO allow passing of the align modes
  // TODO allow adding effects to the image
  try {
    // Read the image.
    const image = await Jimp.read(imagePath);
    // contain the image to the provided width and height.
    // we will get the center part of the image which is the most significant
    // eslint-disable-next-line no-bitwise
    await image.contain(width, height, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
    // Save and overwrite the image
    const imageName = `${Date.now()}_${width}x${height}.png`;
    await image.writeAsync(`uploads/images/resized/${imageName}`);
    return imageName;
  } catch (e) {
    const customerMessage = 'Sorry! An error occurred somewhere while resizing the image';
    Logger.log(
      'error',
      'Error: ',
      {
        fullError: e,
        request: 'resizeImage',
        imagePath,
        technicalMessage: `Unable to resize the image`,
        customerMessage,
      },
    );
    throw new Error(customerMessage);
  }
}

module.exports = imageManipulation;
