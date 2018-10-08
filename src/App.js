import React, { Component } from 'react';
import './App.css';

import GoogleMapReact from 'google-map-react';

const MAPS_API_KEY = require("./maps.api-key.json");

const AnyReactComponent = ({ text }) => <div>{text}</div>;

class SimpleMap extends Component {
  static defaultProps = {
    center: {
      lat: 22.3038,
      lng: 114.1708
    },
    zoom: 11
  };

  render() {
    return (
      // Important! Always set the container height explicitly
      <div style={{ height: '500px', width: '100%' }}>
        <GoogleMapReact
          bootstrapURLKeys={{ key: MAPS_API_KEY }}
          defaultCenter={this.props.center}
          defaultZoom={this.props.zoom}
        >
          <div
            lat={this.props.latitude}
            lng={this.props.longitude}
            style={{ backgroundColor: "red", height: 16, width: 16, borderRadius: 8 }}
          />
          <div
            lat={this.props.bounds[0]}
            lng={this.props.bounds[2]}
            style={{ backgroundColor: "blue", height: 4, width: 4, borderRadius: 2 }}
          />
          <div
            lat={this.props.bounds[0]}
            lng={this.props.bounds[3]}
            style={{ backgroundColor: "blue", height: 4, width: 4, borderRadius: 2 }}
          />
          <div
            lat={this.props.bounds[1]}
            lng={this.props.bounds[2]}
            style={{ backgroundColor: "blue", height: 4, width: 4, borderRadius: 2 }}
          />
          <div
            lat={this.props.bounds[1]}
            lng={this.props.bounds[3]}
            style={{ backgroundColor: "blue", height: 4, width: 4, borderRadius: 2 }}
          />
        </GoogleMapReact>
      </div>
    );
  }
}

class App extends Component {
  constructor (props) {
    super(props);

    this.state = {
      latitude: 22.3038,
      longitude: 114.1708,
      length: 1,
    };
  }

  render() {
    const { latitude, longitude, length } = this.state;

    const key = calculateKey(latitude, longitude, length);

    const bounds = getBounds(key);

    const ROW_COUNT = 4;
    const COL_COUNT = 8;

    const rows = [];
    for (let i = 0; i < ROW_COUNT; i++) {
      const r = [];
      for (let j = 0; j < COL_COUNT; j++) {
        const la0 = 90 - i * 180 / ROW_COUNT;
        const la1 = 90 - (i + 1) * 180 / ROW_COUNT;
        const la = (la0 + la1) / 2;
        const lo0 = -180 + j * 360 / COL_COUNT;
        const lo1 = -180 + (j + 1) * 360 / COL_COUNT;
        const lo = (lo0 + lo1) / 2;
        r.push(calculateKey(la, lo));
      }
      rows.push(r);
    }

    return (
      <div className="App">
        <label>
          Latitude
          <input type="number" min="-90" max="90" value={latitude} onChange={e => this.setState({ latitiude: e.target.value })} />
        </label>
        <label>
          Longitude
          <input type="number" min="-180" max="180" value={longitude} onChange={e => this.setState({ longitude: e.target.value })} />
        </label>
        <label>
          Length
          <input type="number" min="1" max="18" value={length} onChange={e => this.setState({ length: e.target.value })} />
        </label>
        <p>
          {key}
        </p>
        <p>
          {bounds.join(",")}
        </p>
        <SimpleMap
          latitude={latitude}
          longitude={longitude}
          center={{ lat: latitude, lng: longitude }}
          bounds={bounds}
        />
      </div>
    );
  }
}

/*
 *  0 4 8 C G L Q U
 *  1 5 9 D H M R V
 *  2 6 A E J N S W
 *  3 7 B F K P T X
 */
const ALPHA = "0123456789ABCDEFGHJKLMNPQRSTUVWX";

function calculateKey (latitude, longitude, depth=1) {
  let bounds = [-90, 90, -180, 180];
  let key = "";

  while (depth-- > 0) {
    const bits = getKeyBits(latitude, longitude, bounds);
    key += ALPHA[bits2Int(...bits)];
    bounds = getSubBounds(bounds, key.charAt(key.length - 1));
  }

  return key;
}

function getKeyBits (latitude, longitude, [min_lat, max_lat, min_lon, max_lon]) {
  const lat_2 = (min_lat + max_lat) / 2;
  const lat_1 = (min_lat + lat_2) / 2;
  const lat_3 = (lat_2 + max_lat) / 2;

  const b0 = latitude < lat_2 ? 1 : 0;
  const b1 = b0 === 1 ? (latitude < lat_1 ? 1 : 0) : (latitude < lat_3 ? 1 : 0);

  const lon_4 = (min_lon + max_lon) / 2;
  const lon_2 = (min_lon + lon_4) / 2;
  const lon_6 = (lon_4 + max_lon) / 2;
  const lon_1 = (min_lon + lon_2) / 2;
  const lon_3 = (lon_2 + lon_4) / 2;
  const lon_5 = (lon_4 + lon_6) / 2;
  const lon_7 = (lon_6 + max_lon) / 2;

  const b2 = longitude < lon_4 ? 0 : 1;
  const b3 = b2 === 0 ? (longitude < lon_2 ? 0 : 1) : (longitude < lon_6 ? 0 : 1);
  const b4 = b2 === 0 ?
    (b3 === 0 ? (longitude < lon_1 ? 0 : 1) : (longitude < lon_3 ? 0 : 1)) :
    (b3 === 0 ? (longitude < lon_5 ? 0 : 1) : (longitude < lon_7 ? 0 : 1));

  return [b0, b1, b2, b3, b4];
}

function bits2Int (...bits) {
  return parseInt(bits.map(b => String(b)).join(""), 2);
}

function getBounds (key) {
  let bounds = [-90, 90, -180, 180];
  for (const c of key) {
    bounds = getSubBounds(bounds, c);
  }
  return bounds;
}

function getSubBounds (bounds, key) {
  const idx = ALPHA.indexOf(key);
  const b0 = (idx & 16) ? 0 : 1;
  const b1 = (idx & 8) ? 0 : 1;
  const b2 = (idx & 4) >> 2;
  const b3 = (idx & 2) >> 1;
  const b4 = idx & 1;

  const lat_range = bounds[1] - bounds[0];
  const lon_range = bounds[3] - bounds[2];

  const lat_1_2 = lat_range / 2;
  const lat_1_4 = lat_range / 4;

  const lon_1_2 = lon_range / 2;
  const lon_1_4 = lon_range / 4;
  const lon_1_8 = lon_range / 8;

  const min_lat = bounds[0] + (b0 * lat_1_2) + (b1 * lat_1_4);
  const max_lat = min_lat + lat_1_4;

  const min_lon = bounds[2] + (b2 * lon_1_2) + (b3 * lon_1_4) + (b4 * lon_1_8);
  const max_lon = min_lon + lon_1_8;

  return [min_lat, max_lat, min_lon, max_lon];
}

function array2Table (rows) {
  return (
    <table>
      {rows.map(row => (
        <tr>{row.map(cell => <td>{cell}</td>)}</tr>
      ))}
    </table>
  );
}

export default App;
