interface Location {
  lon: number;
  lat: number;
}

interface BoundsResult {
  centerLon: number;
  centerLat: number;
  zoom: number;
}

export function computeBounds(locations: Location[], detailMode: Boolean = false): BoundsResult {
  if (!locations.length) return { centerLon: 0, centerLat: 0, zoom: 1 };

  const lons = locations.map(loc => loc.lon);
  const lats = locations.map(loc => loc.lat);

  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const lonDiff = maxLon - minLon;
  const latDiff = maxLat - minLat;
  const maxDiff = Math.max(lonDiff, latDiff);

  let zoom = 6;
  if (maxDiff > 220) return { centerLon:6.0- (detailMode ? 55 : 0), centerLat:4.0, zoom:1.5 };
  else if (maxDiff > 150) zoom = 1.7;
  else if (maxDiff > 80) zoom = 2.5;
  else if (maxDiff > 30) zoom = 3;
  else if (maxDiff > 15) zoom = 4;
  else if (maxDiff > 8) zoom = 4.6;
  else if (maxDiff > 4) zoom = 5.2;
  else if (maxDiff > 3) zoom = 5.7;
  else zoom = 7;

  const centerLon = (minLon + maxLon) / 2 - (detailMode ? 40 / zoom : 0); 
  const centerLat = (minLat + maxLat) / 2;

//   console.log("Computed bounds:", { maxDiff, centerLon, centerLat, zoom });
  // console.log("Computed bounds:", maxDiff, centerLon, centerLat, zoom );

  return { centerLon, centerLat, zoom };
}



export function offsetFibonacciPosition(lon:number, lat:number, index:number,  zoom = 1.5) {
  const angle = index * 2.39996;
  const radius = 0.05 * Math.sqrt(index);
  const spreadFactor = Math.min(0.1, 1.5 / 10);

  const zoomFactor = Math.max(1, 2 * zoom); // daha yakınsa daha az yay
  const newLon = lon + radius * spreadFactor * zoomFactor * Math.cos(angle);
  const newLat = lat + radius * spreadFactor * zoomFactor * Math.sin(angle);

  return [newLon, newLat];
}


export function offsetCircularPosition(lon:number, lat:number, index:number, totalAtThisPoint = 100) {
  const angle = (index / totalAtThisPoint) * 2 * Math.PI;  // Daire çevresine yay
  const radius = Math.min(0.5, 0.1 + 0.3 / Math.sqrt(totalAtThisPoint));  // Daha az yoğun olan bölgelerde daha geniş dağılır

  const spreadFactor = 0.1;  // İsteğe bağlı artırabilirsin

  const newLon = lon + radius * spreadFactor * Math.cos(angle);
  const newLat = lat + radius * spreadFactor * Math.sin(angle);

  return [newLon, newLat];
}
