import csTools from "cornerstone-tools"
import csCore from "cornerstone-core";

const BaseBrushTool = csTools.importInternal("base/BaseBrushTool");
const external = csTools.importInternal("externalModules");
const segmentationModule = csTools.getModule('segmentation');

function getCircle(
  radius,
  rows,
  columns,
  xCoord = 0,
  yCoord = 0
) {
  const x0 = Math.floor(xCoord);
  const y0 = Math.floor(yCoord);

  if (radius === 1) {
    return [[x0, y0]];
  }

  const circleArray = [];
  let index = 0;

  for (let y = -radius; y <= radius; y++) {
    const yCoord = y0 + y;

    if (yCoord > rows || yCoord < 0) {
      continue;
    }

    for (let x = -radius; x <= radius; x++) {
      const xCoord = x0 + x;

      if (xCoord >= columns || xCoord < 0) {
        continue;
      }

      if (x * x + y * y < radius * radius) {
        circleArray[index++] = [x0 + x, y0 + y];
      }
    }
  }

  return circleArray;
}

function eraseIfSegmentIndex(
  pixelIndex,
  pixelData,
  segmentIndex
) {
  if (pixelData[pixelIndex] === segmentIndex) {
    pixelData[pixelIndex] = 0;
  }
}

function drawBrushPixels(
  pointerArray,
  pixelData,
  segmentIndex,
  columns,
  shouldErase = false
) {
  const getPixelIndex = (x, y) => y * columns + x;

  pointerArray.forEach(point => {
    const spIndex = getPixelIndex(...point);

    if (shouldErase) {
      eraseIfSegmentIndex(spIndex, pixelData, segmentIndex);
    } else {
      pixelData[spIndex] = segmentIndex;
    }
  });
}



export default class CountourFillTool extends BaseBrushTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'CountourFill',
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {},
      hideDefaultCursor: false,
      mixins: [],
    };

    super(props, defaultProps);

    this.preMouseDownCallback = this.preMouseDownCallback.bind(this);
    this._drawingMouseUpCallback = this._drawingMouseUpCallback.bind(this);
    this.proceedCalculations = this.proceedCalculations.bind(this);
    this.draw = this.draw.bind(this);
    this.init = this.init.bind(this);
     }
     init(evt){
       const eventData = evt.detail;
       const element = eventData.element;

       this.rows = eventData.image.rows;
       this.columns = eventData.image.columns;

       const { configuration, getters } = segmentationModule;

       const {
         labelmap2D,
         labelmap3D,
         currentImageIdIndex,
         activeLabelmapIndex,
       } = getters.labelmap2D(element);

       const shouldErase =
         super._isCtrlDown(eventData) || this.configuration.alwaysEraseOnClick;

       this.paintEventData = {
         labelmap2D,
         labelmap3D,
         currentImageIdIndex,
         activeLabelmapIndex,
         shouldErase,
       };
     }

     preMouseDownCallback(evt) {
    const eventData = evt.detail;

    this.init(evt);

    const {element, currentPoints } = eventData;
    this.startCoords = currentPoints.image;

    this._drawing = true;
    super._startListeningForMouseUp(element);
    return true;
  }

    _drawingMouseUpCallback(evt) {
    const eventData = evt.detail;
    const { element, currentPoints } = eventData;

    this.finishCoords = currentPoints.image;

    this._drawing = false;
    super._stopListeningForMouseUp(element);
    this.proceedCalculations(evt);
  }

    proceedCalculations(evt){
    console.log("calculations. Dots start:" + JSON.stringify(this.startCoords) + "Dots finish: " + JSON.stringify(this.finishCoords));
    //logic of getting coordinates to brush
    this.draw(evt);
  }

    draw(evt){
    console.log("we are drawing something");

    const pointerArray1 = getCircle(1, this.rows, this.columns, this.startCoords.x, this.startCoords.y);
      const pointerArray2 = getCircle(1, this.rows, this.columns, this.finishCoords.x, this.finishCoords.y);
    const { labelmap2D, labelmap3D, shouldErase } = this.paintEventData;

    drawBrushPixels(
      pointerArray1,
      labelmap2D.pixelData,
      labelmap3D.activeSegmentIndex,
      this.columns,
      shouldErase
    );

      drawBrushPixels(
        pointerArray2,
        labelmap2D.pixelData,
        labelmap3D.activeSegmentIndex,
        this.columns,
        shouldErase
      );

    external.cornerstone.updateImage(evt.detail.element); //*/
  }

    _paint(evt) {
      return null;
    }

    renderBrush(){
    return null;
  }
}

/*
import csTools from "cornerstone-tools";
import * as d3 from "d3";
const getNewContext = csTools.importInternal("drawing/getNewContext");
const BaseBrushTool = csTools.importInternal("base/BaseBrushTool");
//TODO Otsu threshold
//TODO search contours function
//TODO draw cont
//TODO fragment по точке + все на фрагмент перенести
//TODO выделение
//тест на разных снимках, исправить все неточности(цвет,размерность)
function


  preMouseDownCallback(evt) {
    console.log("Threshold:");
    const eventData = evt.detail;
    const { image, element } = eventData;


    //console.log(element.cornestone-canvas);
    //const context = getNewContext(element.cornestone-canvas);
    //let projection = d3.geoIdentity().scale(imageWidth / imageWidth);
    //const path = d3.geoPath(projection, context);
    //context.strokeStyle = "aqua";
    //context.lineWidth = "2";
    //context.beginPath();
    //path(contours.contour(prepareDataForSearch(PixelData,imageWidth,imageHeight), threshold_mean));
    //context.stroke();

}
*/
