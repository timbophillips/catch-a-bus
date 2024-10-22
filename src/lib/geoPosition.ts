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

// Convert Degress to Radians
const degreesToRadians = (deg: number): number => (deg * Math.PI) / 180;

// uses pythagorus to esitimate distance beween GeolocationPositions
export const distanceBetweenPoints = (point1: point, point2: point): number => {
  // extract co-ordinates and convert degrees to radians
  const point1LatRad = degreesToRadians(point1.position.coords.latitude);
  const point1LongRad = degreesToRadians(point1.position.coords.longitude);
  const point2LatRad = degreesToRadians(point2.position.coords.latitude);
  const point2LongRad = degreesToRadians(point2.position.coords.longitude);

  // work out the x and y axes lengths
  const x =
    (point2LongRad - point1LongRad) *
    Math.cos((point1LatRad + point2LatRad) / 2);
  const y = point2LatRad - point1LatRad;

  // return the hypotenuse
  return Math.sqrt(x ^ (2 + y) ^ 2) * 6371; // 6371 is to convert to km;
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
    name: 'GPS location',
  };
  // create a new array of objects with points and their distances from the index point
  const pointsAndDistances = data.points.map((p) => {
    return {
      point: p,
      distance: distanceBetweenPoints(startingPoint, p),
    };
  });
  // use reduce to find the shortest distance
  const nearestPointAndDistance = pointsAndDistances.reduce(
    (previous, current) => {
      return previous.distance < current.distance ? previous : current;
    }
  );
  // could probably shorten this entire function but kept it readable
  return nearestPointAndDistance;
};
