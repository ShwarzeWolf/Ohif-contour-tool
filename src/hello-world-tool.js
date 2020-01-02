import csTools from "cornerstone-tools"
import csCore from "cornerstone-core";

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
    this.renderBrush = this.renderBrush.bind(this);
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
      //calculations
      console.log(this.startCoords);
      console.log(this.finishCoords);

      //let arrayPolig = [[[]]];
     //this.draw(evt, arrayPolig);
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
          );
        }
      }
    }

    external.cornerstone.updateImage(evt.detail.element); //*/
  }

    _paint() {
      return null;
    }
/*
    renderBrush(){
    return null;
  }
*/

  renderBrush(evt) {
    const {getters, configuration} = segmentationModule;
    const eventData = evt.detail;
    const viewport = eventData.viewport;

    let mousePosition;

    //if (this._drawing) {
    //    mousePosition = this._lastImageCoords;
    //} else
    if (this._mouseUpRender) {
      mousePosition = this._lastImageCoords;
      this._mouseUpRender = false;
    } else {
      mousePosition = csTools.store.state.mousePositionImage;
    }

    if (!mousePosition) {
      return null;
    }

    const {rows, columns} = eventData.image;
    const {x, y} = mousePosition;

    if (x < 0 || x > columns || y < 0 || y > rows) {
      return;
    }

    const radius = 1;
    const context = eventData.canvasContext;
    const element = eventData.element;
    const color = getters.brushColor(element, this._drawing);

    context.setTransform(1, 0, 0, 1, 0, 0);

    let circleRadius = radius * viewport.scale;
    const mouseCoordsCanvas = window.cornerstone.pixelToCanvas(
      element,
      mousePosition,
    );

    const {labelmap2D} = getters.labelmap2D(element);

    const getPixelIndex = (x, y) => y * columns + x;
    const spIndex = getPixelIndex(Math.floor(x), Math.floor(y));
    const isInside = labelmap2D.pixelData[spIndex] === 1;
    this.shouldErase = !isInside;
    context.beginPath();
    context.strokeStyle = color;
    context.fillStyle = "rgba(128,128,128,0.5)";
    context.ellipse(
      mouseCoordsCanvas.x,
      mouseCoordsCanvas.y,
      circleRadius,
      circleRadius,
      0,
      0,
      2 * Math.PI,
    );
    context.stroke();
    context.fill();

    this._lastImageCoords = eventData.image;
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

function roundPoint(coordinates){
  return [ Math.round(coordinates[0]), Math.round(coordinates[1]) ];
}
