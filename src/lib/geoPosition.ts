// type used to name the GeolocationPosition objects
export type point = {
  name: string;
  position: GeolocationPosition;
};

// required to turn the navigator.geolocation.getCurrentPosition
// old school callback function into a promise
// for some reason the scope of the old function
// prevents it from being promisified the usual way
declare global {
  interface Window {
    resolveGeoPosition: (
      value: GeolocationPosition | PromiseLike<GeolocationPosition>
    ) => void;
    rejectGeoposition: (reason?: any) => void;
  }
}

// function to promisify navigator.geolocation.getCurrentPosition
// (see above for scope workaround)
export const getCurrentPosition = (
  options?: PositionOptions
): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    window.resolveGeoPosition = resolve;
    window.rejectGeoposition = reject;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.table(pos);
        window.resolveGeoPosition(pos);
      },
      (err) => {
        window.rejectGeoposition(err);
      },
      Object.assign(
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
        options
      )
    );
  });
};

// accepts an array of points and either an accepted index point
// or the current GPS position if not provided
export const whichPointIsNearest = async (data: {
  points: point[];
  point?: point;
}): Promise<{ point: point; distance: number }> => {
  // if index point not provided then use the current GPS position
  let startingPoint = data.point || {
    position: await getCurrentPosition(),
    name: "GPS location",
  };
  console.log("using this as the starting point");
  console.table(startingPoint);
  // create a new array of objects with points and their distances from the index point
  const pointsAndDistances = data.points.map((p) => {
    return {
      point: p,
      distance: distanceBetweenPointsNew(startingPoint, p),
    };
  });
  console.log("the distances");
  console.table(pointsAndDistances);
  // use reduce to find the shortest distance
  const nearestPointAndDistance = pointsAndDistances.reduce(
    (previous, current) => {
      return previous.distance < current.distance ? previous : current;
    }
  );
  // could probably shorten this entire function but kept it readable
  return nearestPointAndDistance;
};

// Wrapper for the below function to work with my types
const distanceBetweenPointsNew = (point1: point, point2: point): number =>
  distanceBetweenLatLong({
    lat1: point1.position.coords.latitude,
    lon1: point1.position.coords.longitude,
    lat2: point2.position.coords.latitude,
    lon2: point2.position.coords.longitude,
    unit: "K",
  });

// this function lifted from https://www.geodatasource.com/developers/javascript
// with TS tyes put in
const distanceBetweenLatLong = (data: {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
  unit?: string;
}): number => {
  if (data.lat1 == data.lat2 && data.lon1 == data.lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * data.lat1) / 180;
    var radlat2 = (Math.PI * data.lat2) / 180;
    var theta = data.lon1 - data.lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (data.unit == "K") {
      dist = dist * 1.609344;
    }
    if (data.unit == "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }
};
