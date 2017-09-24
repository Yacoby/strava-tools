import React from 'react';
import { Polyline, GeoJSON, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MapWithUpdatableProps from './MapWithUpdatableProps';
import hash from 'object-hash'

import 'leaflet/dist/leaflet.css';

const editableMap = (Map) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        mousePos: {lat: 0, lng: 0},

        cropLines: [],
        currentLineStart: null,
        currentIsCropEnd: false,
      }

      this.onMouseMove = this.onMouseMove.bind(this);
      this.onClick = this.onClick.bind(this);
    }

    onClick(evt) {
      if (this.state.currentLineStart) {
        const newCropLines = this.state.cropLines.slice();
        const cropLine = [this.state.currentLineStart, evt.latlng];
        cropLine.isCropLineEnd = this.state.currentIsCropEnd;
        newCropLines.push(cropLine)
        this.setState({
          currentLineStart: null,
          cropLines: newCropLines,
          currentIsCropEnd: !this.state.currentIsCropEnd,
        });

        this.props.onCropLinesChange(newCropLines);
      } else {
        this.setState({
          currentLineStart: evt.latlng,
        });
      }
    }

    onMouseMove(evt) {
      this.setState({mousePos: evt.latlng});
    }

    getCropLineColor(isCropLineEnd) {
      return isCropLineEnd ? 'red' : 'green';
    }

    render() {
      return (
        <Map onMouseMove={this.onMouseMove}
             onClick={this.onClick}
             dragging={!this.state.isEditing}
             {...this.props}>

           {this.state.cropLines.map((line) => (
             <Polyline positions={line} color={this.getCropLineColor(line.isCropLineEnd)} />
           ))}
           {this.state.currentLineStart &&
             <Polyline positions={[this.state.currentLineStart, this.state.mousePos]} color={this.getCropLineColor(this.state.currentIsCropEnd)} />
           }
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
      color: 'blue',
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
