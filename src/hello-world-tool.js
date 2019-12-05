import csTools from "cornerstone-tools";
const BaseBrushTool = csTools.importInternal("base/BaseBrushTool");
const external = csTools.importInternal("externalModules");



import { getModule } from "cornerstone-tools";
import { drawBrushPixels, getCircle } from 'cornerstone-tools';

const segmentationModule = getModule('segmentation');

export default class MySegmentationTool extends BaseBrushTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'MySegmentation',
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {},
      mixins: ['renderBrushMixin'],
    };

    super(props, defaultProps);

    this.touchDragCallback = this._paint.bind(this);
  }

  _paint(evt) {
    console.log(evt);

    const { configuration } = segmentationModule;
    const eventData = evt.detail;
    const element = eventData.element;
    const { rows, columns } = eventData.image;
    const { x, y } = eventData.currentPoints.image;

    if (x < 0 || x > columns || y < 0 || y > rows) {
      return;
    }

    const radius = configuration.radius;
    const pointerArray = getCircle(radius, rows, columns, x, y);

    const { labelmap2D, labelmap3D, shouldErase } = this.paintEventData;

    drawBrushPixels(
      pointerArray,
      labelmap2D.pixelData,
      labelmap3D.activeSegmentIndex,
      columns,
      shouldErase
    );

    external.cornerstone.updateImage(evt.detail.element);
  }
}