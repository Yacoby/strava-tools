import React from 'react';
import geoutil from '../geo-util';

class Eraser extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      brushSize: 10,
    };

    this.lastUpdateTime = new Date().getTime();
    this.geoJson = props.geoJson;

    this.isMouseDown = false;

    this.increaseBrushSize = this.increaseBrushSize.bind(this);
    this.decreaseBrushSize = this.decreaseBrushSize.bind(this);

    this.brush = L.circle([0, 0], {
      radius: this.state.brushSize * this.props.map.getZoom(),
    }).addTo(this.props.map);

    this.props.map.dragging.disable();

    this.registeredListeners = {
      mousemove: this.onMouseMove.bind(this),
      mousedown: this.onMouseDown.bind(this),
      mouseup: this.onMouseUp.bind(this),
    };
    this.props.map.on(this.registeredListeners);
  }

  increaseBrushSize() {
    this.setState({
      brushSize: this.state.brushSize + 20,
    });
  }

  decreaseBrushSize() {
    this.setState({
      brushSize: this.state.brushSize - 20,
    });
  }

  onMouseMove(e) {
    this.brush.setLatLng(e.latlng);
    if (this.isMouseDown) {
      this.erase(e);
    }
  }

  onMouseDown(e) {
    this.erase(e);
    this.isMouseDown = true;
  }

  onMouseUp(e) {
    this.isMouseDown = false;
  }

  erase(e) {
    if (this.lastUpdateTime > new Date().getTime() - 25) {
      return;
    }
    this.lastUpdateTime = new Date().getTime();
    const distance = this.state.brushSize * this.props.map.getZoom();
    this.geoJson = geoutil.deletePointsWhere(
      this.props.geoJson,
      (context, coord) => {
        return (
          e.latlng.distanceTo(L.latLng(coord.slice(0, 2).reverse())) < distance
        );
      }
    );
    this.props.onUpdateMap(this.geoJson);
  }

  render() {
    this.brush.setRadius(this.state.brushSize * this.props.map.getZoom());
    return (
      <div>
        <a onClick={this.increaseBrushSize}>Bigger</a>,{' '}
        <a onClick={this.decreaseBrushSize}>Smaller</a>{' '}
      </div>
    );
  }

  componentWillUnmount() {
    this.props.map.off(this.registeredListeners);

    this.brush.remove();
    this.props.map.dragging.enable();
  }
}

export { Eraser };
