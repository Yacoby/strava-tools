import React from 'react';
import {render} from 'react-dom';
import _ from 'lodash'

import { saveAs } from 'file-saver';
import FileReaderInput from 'react-file-reader-input';

import EditableGeoMap  from './components/EditableMap';

import geolib from 'geolib';
import geoutil from './geo-util'
import ToGeoJson from 'togeojson';
import togpx from 'togpx';


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
    this.onDelete = this.onDelete.bind(this);
    this.downloadGpx= this.downloadGpx.bind(this);

    this.state = {
      geoJson: {
        "type": "FeatureCollection",
        "features": []
      },
      startingBounds: [[49, -123.310547],[50,-120.673828]],
    }
  }
  handleUpload(gpxData) {
    const geoJson = ToGeoJson.gpx((new DOMParser()).parseFromString(gpxData, 'text/xml'));
    const {maxLat, minLat, maxLng, minLng} = geolib.getBounds(geoutil.toPoints(geoJson));
    const bounds = [[maxLat, maxLng], [minLat, minLng]];
    this.setState({
      geoJson: splitIntoLines(geoJson),
      startingBounds: bounds,
    });
  }

  onDelete(latlng, dist) {
    const newGeoJson = geoutil.deletePointsWhere(this.state.geoJson, (context, coord) => {
      return context.previous && geolib.getDistance(coord, latlng) < dist
    });
    this.setState({geoJson: newGeoJson});
  }

  downloadGpx() {
    const gpx = togpx(geoutil.concatFeatures(this.state.geoJson));
    const blob = new Blob([gpx], {type: "text/plain;charset=utf-8"});
    debugger;
    saveAs(blob, "trimmed.gpx");
  }

  render () {
    return (
      <div>
        <FileUpload onDataLoad={this.handleUpload}/> | <a onClick={this.downloadGpx}>Download GPX</a>
        <hr />
        <EditableGeoMap geoJson={this.state.geoJson} onDelete={this.onDelete} bounds={this.state.startingBounds}/>
      </div>
    )
  }
}

render(<App/>, document.getElementById('root'));
