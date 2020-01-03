import csTools from "cornerstone-tools"
const BaseBrushTool = csTools.importInternal("base/BaseBrushTool");
const external = csTools.getModule("externalModules");
const segmentationModule = csTools.getModule('segmentation');
const drawEllipse = csTools.importInternal("drawing/drawEllipse");

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
    this.init = this.init.bind(this);
    this.renderBrush = this.renderBrush.bind(this);
    this.mouseDragCallback = this.mouseDragCallback.bind(this);
     }

     init(evt){
       const eventData = evt.detail;
       const element = eventData.element;

       this.rows = eventData.image.rows;
       this.columns = eventData.image.columns;

       const {getters } = segmentationModule;

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

      const {element, currentPoints} = eventData;

      this.startCoords = currentPoints.image;

      this._drawing = true;
      super._startListeningForMouseUp(element);
      this._lastImageCoords = currentPoints.image;

      return true;
    }

      _drawingMouseUpCallback(evt) {
      const eventData = evt.detail;
      const { element, currentPoints } = eventData;

      this.finishCoords = currentPoints.image;

      this._drawing = false;
      super._stopListeningForMouseUp(element);
    }

    _paint() {
      return null;
    }

  mouseDragCallback(evt) {
    const { currentPoints } = evt.detail;

    this._lastImageCoords = currentPoints.image;
    this.renderBrush(evt);
  }

  renderBrush(evt) {
    const {getters} = segmentationModule;
    const eventData = evt.detail;
    const viewport = eventData.viewport;

    let mousePosition;

    if (this._drawing) {
      const context = eventData.canvasContext;
      const element = eventData.element;
      mousePosition = this._lastImageCoords; //end ellipse point
      let startPointForDrawing = this.startCoords; //start ellipse point
      const color = getters.brushColor(element, this._drawing);

      drawEllipse(
        this.context,
        element,
        startPointForDrawing,
        mousePosition,
        {
          color,
        },
        'pixel',
        0.0)
    }
    else
      {
      mousePosition = csTools.store.state.mousePositionImage;

      if (!mousePosition) {
        return;
      }

      const { rows, columns } = eventData.image;
      const { x, y } = mousePosition;

      if (x < 0 || x > columns || y < 0 || y > rows) {
        return;
      }

      const radius = 1;
      const context = eventData.canvasContext;
      this.context = context;
      const element = eventData.element;
      const color = getters.brushColor(element, this._drawing);

      context.setTransform(1, 0, 0, 1, 0, 0);

      let circleRadius = radius * viewport.scale;
      const mouseCoordsCanvas = window.cornerstone.pixelToCanvas(
        element,
        mousePosition,
      );

      const { labelmap2D } = getters.labelmap2D(element);

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
