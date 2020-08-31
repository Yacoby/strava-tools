import React from 'react';
import geoutil from '../geo-util';
import { Input, Menu } from 'semantic-ui-react';

import { Slider } from 'react-semantic-ui-range';
import 'semantic-ui-css/semantic.min.css';

class Eraser extends React.Component {
  maxBrushSize = 100;

  constructor(props) {
    super(props);

    this.state = {
      brushSize: 10,
    };

    this.lastUpdateTime = new Date().getTime();
    this.geoJson = props.geoJson;

    this.isMouseDown = false;

    this.setBrushSize = this.setBrushSize.bind(this);
    this.handleBrushSizeInput = this.handleBrushSizeInput.bind(this);

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

  setBrushSize(size) {
    this.setState({
      brushSize: size,
    });
  }

  handleBrushSizeInput(e) {
    let value = parseInt(e.target.value);
    if (!value) {
      value = 0;
    }
    value = Math.min(Math.max(value, 0), this.maxBrushSize);
    this.setBrushSize(value);
  }

  render() {
    this.brush.setRadius(this.state.brushSize * this.props.map.getZoom());
    return (
      <Menu vertical>
        <Menu.Item>
          Brush Size
          <Input
            onChange={this.handleBrushSizeInput}
            type='number'
            value={this.state.brushSize}
          />
          <Slider
            value={this.state.brushSize}
            color='red'
            settings={{
              start: this.state.brushSize,
              min: 0,
              max: this.maxBrushSize,
              step: 1,
              onChange: (value) => {
                this.setBrushSize(value);
              },
            }}
          />
        </Menu.Item>
      </Menu>
    );
  }

  componentWillUnmount() {
    this.props.map.off(this.registeredListeners);

    this.brush.remove();
    this.props.map.dragging.enable();
  }
}

export { Eraser };
