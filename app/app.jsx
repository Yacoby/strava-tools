import React from 'react';
import { render } from 'react-dom';

import { saveAs } from 'file-saver';
import FileReaderInput from 'react-file-reader-input';

import * as geolib from 'geolib';
import geoutil from './geo-util';
import toGeoJson from 'togeojson';
import togpx from 'togpx';

import './index.html';
import 'bootstrap/dist/css/bootstrap.css';
import { Eraser } from './tools/eraser';
import { Move } from './tools/move';
import {
  faArrowsAlt,
  faEraser,
  faFolderOpen,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navbar } from 'react-bootstrap';

class FileUpload extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e, results) {
    results.forEach((result) => {
      const [e, file] = result;
      const fileReader = new FileReader();
      fileReader.onload = (data) => {
        this.props.onDataLoad(fileReader.result);
      };
      fileReader.readAsText(file);
    });
  }

  render() {
    return (
      <FileReaderInput as='text' onChange={this.handleChange}>
        <FontAwesomeIcon icon={faFolderOpen} />
      </FileReaderInput>
    );
  }
}

function splitIntoLines(geoObj) {
  return geoutil.splitPointsWhere(geoObj, function (context, coord) {
    return (
      context.previous &&
      geolib.getDistance(coord, context.previous.coord) > 100
    );
  });
}

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      geoJsonVersio: Math.random(),
    };
    this.onMapLoad = props.onMapLoad;
  }

  componentDidMount() {
    this.map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    this.onMapLoad(this.map);

    this.track = L.geoJSON(this.props.geoJson || [], {
      style: function (feature) {
        return { color: feature.properties.color };
      },
    });
    this.track.addTo(this.map);
  }

  componentDidUpdate() {
    if (this.props.geoJsonVersion === 0) {
      this.map.fitBounds(this.props.startingBounds);
    }

    if (this.props.geoJsonVersion !== this.state.geoJsonVersion) {
      this.track.remove();
      this.track = L.geoJSON(this.props.geoJson || []);
      this.track.addTo(this.map);
      this.state.geoJsonVersio = this.props.geoJsonVersion;
    }
  }

  render() {
    return <div id={'map'} />;
  }
}

const tools = [
  ['Eraser', Eraser, faEraser],
  ['Move', Move, faArrowsAlt],
];

class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleUpload = this.handleUpload.bind(this);
    this.downloadGpx = this.downloadGpx.bind(this);
    this.loadTool = this.loadTool.bind(this);
    this.onMapLoad = this.onMapLoad.bind(this);

    this.state = {
      toolComponent: Move,
      geoJsonData: {
        type: 'FeatureCollection',
        features: [],
      },
      geoJsonDataVersion: 0,
      startingBounds: [
        [49, -123.310547],
        [50, -120.673828],
      ],
    };
  }

  handleUpload(gpxData) {
    const geoJson = toGeoJson.gpx(
      new DOMParser().parseFromString(gpxData, 'text/xml')
    );
    const { maxLat, minLat, maxLng, minLng } = geolib.getBounds(
      geoutil.toPoints(geoJson)
    );
    const bounds = [
      [maxLat, maxLng],
      [minLat, minLng],
    ];
    this.setState({
      geoJsonData: splitIntoLines(geoJson),
      geoJsonDataVersion: 0,
      startingBounds: bounds,
    });
  }

  downloadGpx() {
    const gpx = togpx(geoutil.concatFeatures(this.state.geoJsonData));
    const blob = new Blob([gpx], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'trimmed.gpx');
  }

  loadTool(toolComponent) {
    this.setState({
      toolComponent: toolComponent,
    });
  }

  onMapLoad(map) {
    this.setState({
      map: map,
    });
  }

  onTrackChange(geoJson) {
    console.log('new geo json!!');
    this.setState({
      geoJsonData: geoJson,
      geoJsonDataVersion: Math.random(),
    });
  }

  render() {
    const ToolComponent = this.state.toolComponent;
    return (
      <div>
        <Navbar>
          <FileUpload onDataLoad={this.handleUpload} />
          <a onClick={this.downloadGpx}>
            <FontAwesomeIcon icon={faSave} />
          </a>
        </Navbar>
        <ul>
          {tools.map(([toolName, toolComponent, icon]) => {
            return (
              <li key={toolName}>
                <FontAwesomeIcon
                  icon={icon}
                  onClick={() => this.loadTool(toolComponent)}
                />
              </li>
            );
          })}
        </ul>

        <ToolComponent
          geoJson={this.state.geoJsonData}
          map={this.state.map}
          onUpdateMap={this.onTrackChange.bind(this)}
        />

        <Map
          onMapLoad={this.onMapLoad}
          geoJson={this.state.geoJsonData}
          geoJsonVersion={this.state.geoJsonDataVersion}
          startingBounds={this.state.startingBounds}
        />
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
