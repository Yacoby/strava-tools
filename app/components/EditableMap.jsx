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
      }

      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
    }

    onMouseMove(evt) {
      this.setState({mousePos: evt.latlng});

      if (this.state.isEditing) {
        this.props.onDelete && this.props.onDelete(evt.latlng, 200)
      }
    }

    onMouseDown(evt) {
      if (evt.originalEvent.which === 3 || evt.originalEvent.ctrlKey ) {
        this.setState({isEditing: true});
      }
    }
    onMouseUp(evt) {
      this.setState({isEditing: false})
    }

    onContextMenu(evt) {
      return false;
    }

    render() {
      return (
        <Map onMouseMove={this.onMouseMove} 
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          dragging={!this.state.isEditing}
          onContextMenu={this.onContextMenu}
          {...this.props}>
          <Circle center={this.state.mousePos} radius={200} />
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
