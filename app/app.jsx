import React from 'react';
import {render} from 'react-dom';
import _ from 'lodash'

import { saveAs } from 'file-saver';
import FileReaderInput from 'react-file-reader-input';

import EditableGeoMap  from './components/EditableMap';

import * as turf from '@turf/turf'
import * as geolib from 'geolib';
import geoutil from './geo-util'
import toGeoJson from 'togeojson';
import togpx from 'togpx';

import './index.html'
import 'bootstrap/dist/css/bootstrap.css';

class FileUpload extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(e, results) {
    results.forEach(result => {
      const [e, file] = result;
      const fileReader = new FileReader();
      fileReader.onload = (data) => {
        this.props.onDataLoad(fileReader.result);
      }
      fileReader.readAsText(file);
    });
  }

  render() {
    return (
      <form>
        <FileReaderInput as="text" onChange={this.handleChange}>
          <a>Upload a GPX File</a>
        </FileReaderInput>
      </form>
    );
  }
}


function splitIntoLines(geoObj) {
  return geoutil.splitPointsWhere(geoObj, function (context, coord) {
    return context.previous && geolib.getDistance(coord, context.previous.coord) > 100;
  });
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleUpload = this.handleUpload.bind(this);
    this.onCropPressed = this.onCropPressed.bind(this);
    this.downloadGpx = this.downloadGpx.bind(this);

    this.state = {
      geoJson: {
        "type": "FeatureCollection",
        "features": []
      },
      startingBounds: [[49, -123.310547],[50,-120.673828]],
    }
  }

  handleUpload(gpxData) {
    const geoJson = toGeoJson.gpx((new DOMParser()).parseFromString(gpxData, 'text/xml'));
    const {maxLat, minLat, maxLng, minLng} = geolib.getBounds(geoutil.toPoints(geoJson));
    const bounds = [[maxLat, maxLng], [minLat, minLng]];
    this.setState({
      geoJson: splitIntoLines(geoJson),
      startingBounds: bounds,
    });
  }

  onCropPressed(cropLines) {
    let isDeleting = false;
    const newGeoJson = geoutil.deletePointsWhere(this.state.geoJson, (context, coord) => {
      if (!context.previous) {
        return isDeleting; // todo is this the correct behaviour?
      }

      const currentSegment = turf.lineString([context.previous.coord, coord].map((ll) => ll.slice(0, 2)));
      const intersections = cropLines.filter((line) => {
        const cropLineString = turf.lineString(line.map((ll) => [ll.lng, ll.lat]));
        return turf.lineIntersect(cropLineString, currentSegment).features.length > 0;
      });

      if (intersections.length) {
        isDeleting = !_.last(intersections).isCropLineEnd;
      }
      return isDeleting;
    });
    this.setState({geoJson: newGeoJson});
  }

  onCropLinesChange(cropLines) {
    this.setState({cropLines});
  }

  downloadGpx() {
    const gpx = togpx(geoutil.concatFeatures(this.state.geoJson));
    const blob = new Blob([gpx], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "trimmed.gpx");
  }

  render () {
    return (
      <div>
        <FileUpload onDataLoad={this.handleUpload}/> | <a onClick={this.downloadGpx}>Download GPX</a>
        <EditableGeoMap geoJson={this.state.geoJson} onCropPressed={this.onCropPressed} bounds={this.state.startingBounds}/>
      </div>
    )
  }
}

render(<App/>, document.getElementById('root'));
