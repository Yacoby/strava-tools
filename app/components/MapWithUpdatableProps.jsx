import { Map } from 'react-leaflet';

export default class MapWithUpdatableProps extends Map {
  componentWillUpdate(nextProps) {
    if (nextProps.dragging !== this.props.dragging) {
      const dragging = this.leafletElement.dragging;
      nextProps.dragging ? dragging.enable() : dragging.disable();
    }
  }
}
