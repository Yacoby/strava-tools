import clone from 'clone';
import _ from 'lodash';

function toPoints(geoObj) {
  return _.flatMap(geoObj.features, (feature) => {
    return feature.geometry.coordinates;
  });
}

function reducePoints(geoObj, fn) {
  const result = clone(geoObj);
  result.features = _.flatMap(geoObj.features, (feature) => {
    const coordsWithTime = _.zip(
      feature.geometry.coordinates,
      feature.properties.coordTimes
    );
    const newCoords = coordsWithTime.reduce(
      (arr, coordWithTime, index) => {
        const [coord, time] = coordWithTime;

        let previous = null;
        if (index > 0) {
          previous = {
            coord: feature.geometry.coordinates[index - 1],
            time: feature.properties.coordTimes[index - 1],
          };
        }
        const context = { feature, previous };

        return fn(arr, context, coord, time);
      },
      [[]]
    );

    return newCoords
      .filter((newCoord) => newCoord.length > 0)
      .map((newCoord) => {
        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: _.unzip(newCoord)[0],
          },
          properties: {
            ...feature.properties,
            coordTimes: _.unzip(newCoord)[1],
          },
        };
      });
  });
  return result;
}

function splitPointsWhere(geoObj, fn) {
  return reducePoints(geoObj, (arr, context, coord, time) => {
    const coordWithTime = [coord, time];
    if (fn(context, coord, time)) {
      arr.push([coordWithTime]);
    } else {
      arr[arr.length - 1].push(coordWithTime);
    }
    return arr;
  });
}

function deletePointsWhere(geoObj, fn) {
  const removedPoints = reducePoints(geoObj, (arr, context, coord, time) => {
    const coordWithTime = [coord, time];
    if (fn(context, coord, time)) {
      arr.push([]);
    } else {
      arr[arr.length - 1].push(coordWithTime);
    }
    return arr;
  });

  // Single point features don't show on the map, but remain in the exported gpx. We want to remove these
  removedPoints.features = removedPoints.features.filter(
    (feature) => feature.geometry.coordinates.length > 1
  );
  return removedPoints;
}

function concatFeatures(geoObj) {
  const combinedFeature = geoObj.features.reduce((acc, feature) => {
    return {
      ...acc,
      ...feature,
      geometry: {
        ...acc.geometry,
        ...feature.geometry,
        coordinates: _.concat(
          acc.geometry.coordinates,
          feature.geometry.coordinates
        ),
      },
      properties: {
        ...acc.properties,
        ...feature.properties,
        coordTimes: _.concat(
          acc.properties.coordTimes,
          feature.properties.coordTimes
        ),
      },
    };
  });
  const result = clone(geoObj);
  result.features = [combinedFeature];
  return result;
}

export default {
  toPoints,
  concatFeatures,
  splitPointsWhere,
  deletePointsWhere,
};
