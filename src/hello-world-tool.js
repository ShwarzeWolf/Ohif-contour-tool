import csTools from "cornerstone-tools"
import csCore from "cornerstone-core";

import * as d3 from "d3";

const BaseBrushTool = csTools.importInternal("base/BaseBrushTool");
const external = csTools.importInternal("externalModules");
const segmentationModule = csTools.getModule('segmentation');

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
    //logic of getting coordinates to brush
    //get Image
    const image = evt.detail.image;
    const imagePixelData = image.getPixelData();
    const imageWidth = image.width;
    const imageHeight = image.height;

    //cut fragment for count threshold
    let xS = this.startCoords.x.valueOf();
    let yS = this.startCoords.y.valueOf();
    let xE = this.finishCoords.x.valueOf();
    let yE = this.finishCoords.y.valueOf();
    const highlFragment = cutHilghFragm(xS, yS, xE, yE, imagePixelData);

    //count threshold
    const mean_threshold = mean_thresh(highlFragment);
    console.log(mean_threshold);

    //TODO get fragment

    //prepare data for search
    const preparedData = prepareDataForSearch(imagePixelData, imageWidth, imageHeight);

    //search contours
    const arrayPolig = searchCont(preparedData, mean_threshold, imageWidth, imageHeight);

   this.draw(evt, arrayPolig);
  };

    draw(evt, points){
    const { labelmap2D, labelmap3D, shouldErase } = this.paintEventData;
    const columns = this.columns;
 // console.log(points.length);
    for(let i = 0; i < points.length; ++i ){
      for (let k = 0; k < points[i].length; ++k) {
        for (let j = 0; j < points[i][k].length; ++j) {
          let curPoint = roundPoint(points[i][0][j]);
          console.log(curPoint);
          drawBrushPixels(
            [curPoint],
            labelmap2D.pixelData,
            labelmap3D.activeSegmentIndex,
            columns,
            shouldErase
          );//*/
        }
      }
    }

    external.cornerstone.updateImage(evt.detail.element); //*/
  }

    _paint() {
      return null;
    }

    renderBrush(){
    return null;
  }
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

function mean_thresh(highlData) {
  let threshold = 0;
  let sum = 0;
  for(let i = 0; i < highlData.length; i++){
    sum = sum + highlData[i];
  }
  threshold = sum/highlData.length;
  return threshold; //check
}

function cutHilghFragm(xS, yS, xE, yE, imagePixelData) {
  let xStart = Math.round(xS);
  let yStart = Math.round(yS);
  let xEnd = Math.round(xE);
  let yEnd = Math.round(yE);
  let widthHighl = Math.abs(xStart-xEnd);
  let heightHighl = Math.abs(yStart-yEnd);
  let distance = widthHighl * heightHighl;
  let xCut = Math.min(xStart,xEnd);
  let yCut = Math.min(yStart,yEnd);
  let beginCut = xCut * yCut;
  let endCut = beginCut + distance;
  return imagePixelData.slice(beginCut, endCut);
}

function prepareDataForSearch(fragmData, fragmWidth, fragmHeight) {
  const values = new Float64Array(fragmWidth * fragmHeight);
  //StackBlur.R(imageData, 3); TODO import function
  for (let j = 0, k = 0; j < fragmHeight; ++j) {
    for (let i = 0; i < fragmWidth; ++i, ++k) {
      values[k] = fragmData[(k << 2)]; //check
    }
  }
  return values;
}

function searchCont(preparedData, mean_thresh, fragmWidth, fragmHeight){
  let contoursArray = d3.contours().size([fragmWidth, fragmHeight]);
  let contours = contoursArray.contour(preparedData, mean_thresh);
  return contours.coordinates;
}

function roundPoint(coordinates){
  return [ Math.round(coordinates[0]), Math.round(coordinates[1]) ];
}
