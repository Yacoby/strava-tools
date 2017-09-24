import React from 'react';
import { GeoJSON, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MapWithUpdatableProps from './MapWithUpdatableProps';
import hash from 'object-hash'

import 'leaflet/dist/leaflet.css';

const editableMap = (Map) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        mousePos: {lat: 0, lng: 0},
        isEditing: false,
        editSize: 10,
      }

      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
      this.onZoomEnd = this.onZoomEnd.bind(this);
    }

    onMouseMove(evt) {
      this.setState({mousePos: evt.latlng});

      if (this.state.isEditing) {
        this.props.onDelete && this.props.onDelete(evt.latlng, this.state.editSize)
      }
    }

    onMouseDown(evt) {
      if (evt.originalEvent.which === 3 || evt.originalEvent.ctrlKey ) {
        this.setState({isEditing: true});
        this.props.onDelete && this.props.onDelete(evt.latlng, this.state.editSize)
      }
    }

    onMouseUp(evt) {
      this.setState({isEditing: false})
    }

    onContextMenu(evt) {
      return false;
    }

    onZoomEnd(evt) {
      const mapSize = 1/Math.pow(2, evt.target._zoom);
      this.setState({editSize: mapSize * 3276800})
    }

    render() {
      const circleColour = this.state.isEditing ? 'red' : 'blue';
      return (
        <Map onMouseMove={this.onMouseMove}
             onMouseDown={this.onMouseDown}
             onMouseUp={this.onMouseUp}
             dragging={!this.state.isEditing}
             onContextMenu={this.onContextMenu}
             onZoomEnd={this.onZoomEnd}
             {...this.props}>
          <Circle center={this.state.mousePos} radius={this.state.editSize} color={circleColour} />
        </Map>
      );
    }
  }
}




class GeoJsonMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lat: 49.2,
      lng: -123.2,
      zoom: 13,
      open: false,
    };
  }

  getStyle(feature, layer) {
    return {
      color: '#006400',
      weight: 5,
      opacity: 0.65
    }
  }

  render() {
    const position = [this.state.lat, this.state.lng];

    return (
      <div>
        <MapWithUpdatableProps center={position} zoom={this.state.zoom}  {...this.props}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
          />
          <GeoJSON data={this.props.geoJson} style={this.getStyle} key={hash(this.props.geoJson)} />
          { this.props.children }
        </MapWithUpdatableProps>

        <div>
          To remove parts of the line, either CTRL + Click or Right Click
        </div>
      </div>
    );
  }
}

export default editableMap(GeoJsonMap);
