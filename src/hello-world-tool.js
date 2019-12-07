import csTools from "cornerstone-tools"
import csCore from "cornerstone-core";

const BaseBrushTool = csTools.importInternal("base/BaseBrushTool");

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

    this._drawing = false;
    this.preMouseDownCallback = this.preMouseDownCallback.bind(this);
    this._drawingMouseUpCallback = this._drawingMouseUpCallback.bind(this);
    this.touchDragCallback = this._paint.bind(this);
     }

  preMouseDownCallback(evt) {
    console.log("start points");
    const eventData = evt.detail;
    const { element, currentPoints } = eventData;

    this.startCoords = currentPoints.image;
    console.log(JSON.stringify(this.startCoords));

    this._drawing = true;
    super._startListeningForMouseUp(element);
    return true;
  }

   _drawingMouseUpCallback(evt) {
    console.log("finish points");

    const eventData = evt.detail;
    const { element, currentPoints } = eventData;

    this.finishCoords = currentPoints.image;
    console.log(JSON.stringify(this.finishCoords));

    this._drawing = false;
    super._stopListeningForMouseUp(element);
  }

  _paint(evt) {
    return null;
  }

  renderBrush(){
    return null;
  }
}
