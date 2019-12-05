const element = document.querySelector('button');

cornerstoneTools.init();
cornerstone.enable(element);

const toolName = 'MySelector';
const imageId = '../1544041529_051220174.jpg"';

// Display our Image
cornerstone.loadImage(imageId).then(function(image) {
  cornerstone.displayImage(element, image);
});

// Add the tool
const apiTool = cornerstoneTools[`${toolName}Tool`];
cornerstoneTools.addTool(apiTool);
cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });