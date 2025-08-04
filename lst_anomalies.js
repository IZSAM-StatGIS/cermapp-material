// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  Description   LST anomalies in a given period in this case 2022 respect to the mean 1984-2022
//  Date:         08/07/2025 dd-mm-yyyy
//  Author:       Tommaso Orusa t.orusa@izs.it  - tommaso.orusa@gmail.com 
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// SET YOUR CENTER LAT LON
var geometry = ui.import && ui.import("geometry", "geometry", {
        "geometries": [{
            "type": "Point",
            "coordinates": [
                7.7338, 45.6075
            ]
        }],
        "displayProperties": [],
        "properties": {},
        "color": "#0b4a8b",
        "mode": "Geometry",
        "shown": false,
        "locked": false
    }) ||
    /* color: #0b4a8b */
    /* shown: false */
    ee.Geometry.Point([7.7338, 45.6075]);

// ------------------------------------------------------------------------
//  Define YOUR area of interest
// ------------------------------------------------------------------------

var aoi = ee.FeatureCollection("projects/izsgis-am/assets/VDA_INVA_OK_ED50")
    .filterBounds(geometry);

// ------------------------------------------------------------------------
//  Define area of interest extent rectangle.
// ------------------------------------------------------------------------

var aoi_extent = aoi
    .geometry()
    .bounds();

Map.centerObject(aoi_extent, 10);
Map.setOptions('hybrid');

Map.addLayer(aoi, {
    color: "yellow"
}, "AOI", false);
Map.addLayer(aoi_extent, {}, "AOI Extent", false);

print(
    "AOI", aoi,
    "EXTENT", aoi_extent
);

// ------------------------------------------------------------------------
//  Calculate LST from Landsat Collection.
// ------------------------------------------------------------------------

var LandsatLST = require('users/sofiaermida/landsat_smw_lst:modules/Landsat_LST.js');

// Function to get full collection (1984-2022)
function getFullCollection() {
  // Process in smaller time chunks
  var periods = [
    {start: '1984-01-01', end: '1990-12-31'}, // Landsat 5 only
    {start: '1991-01-01', end: '1998-12-31'}, // Landsat 5 only
    {start: '1999-01-01', end: '2002-12-31'}, // Landsat 5 + 7
    {start: '2003-01-01', end: '2012-12-31'}, // Landsat 5 + 7
    {start: '2013-01-01', end: '2021-12-31'}, // Landsat 7 + 8
    {start: '2022-01-01', end: '2022-12-31'}  // Landsat 8 + 9
  ];
  
  // Process each period separately
  var processedPeriods = periods.map(function(period) {
    // Get collections for this period
    var l5 = (ee.Date(period.end).difference(ee.Date('2013-01-01'), 'year').lt(0) ? 
      LandsatLST.collection('L5', period.start, period.end, aoi_extent) : 
      ee.ImageCollection([]));
    
    var l7 = LandsatLST.collection('L7', period.start, period.end, aoi_extent);
    var l8 = (ee.Date(period.start).difference(ee.Date('2013-01-01'), 'year').gte(0) ? 
      LandsatLST.collection('L8', period.start, period.end, aoi_extent) : 
      ee.ImageCollection([]));
    
    var l9 = (ee.Date(period.start).difference(ee.Date('2021-01-01'), 'year').gte(0) ? 
      LandsatLST.collection('L9', period.start, period.end, aoi_extent) : 
      ee.ImageCollection([]));
    
    // Merge and filter
    return l5.merge(l7).merge(l8).merge(l9)
      .filter(ee.Filter.calendarRange(7, 8, 'month'))
      .filter(ee.Filter.lt('CLOUD_COVER', 15));
  });
  
  // Combine all periods
  var combined = ee.ImageCollection(processedPeriods[0]);
  for (var i = 1; i < processedPeriods.length; i++) {
    combined = combined.merge(processedPeriods[i]);
  }
  
  return combined;
}

// Function to get 2022 data only
function get2022Collection() {
  var l8 = LandsatLST.collection('L8', '2022-07-01', '2022-08-31', aoi_extent);
  var l9 = LandsatLST.collection('L9', '2022-07-01', '2022-08-31', aoi_extent);
  
  return l8.merge(l9)
    .filter(ee.Filter.lt('CLOUD_COVER', 15));
}

// ------------------------------------------------------------------------
//  Cloud mask
// ------------------------------------------------------------------------

function cloudMask_L8(image) {
    var qa = image.select('QA_PIXEL');
    var dilatedCloudBitMask = 1 << 2;
    var cirrusBitMask = 1 << 2;
    var cloudBitMask = 1 << 3;
    var cloudShadowBitMask = 1 << 4;

    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
        .and(qa.bitwiseAnd(cloudShadowBitMask).eq(0))
        .and(qa.bitwiseAnd(dilatedCloudBitMask).eq(0))
        .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

    return image.updateMask(mask).select('LST');
}

// ------------------------------------------------------------------------
//  Process collections
// ------------------------------------------------------------------------

// Process full collection with memory limits
var full_filtered = ee.ImageCollection(
  getFullCollection().map(cloudMask_L8).toList(1000) // Limit to 1000 images
);

// Process 2022 collection
var year2022_filtered = ee.ImageCollection(
  get2022Collection().map(cloudMask_L8).toList(100) // Limit to 100 images
);

// ------------------------------------------------------------------------
//  Calculate mean images in °C
// ------------------------------------------------------------------------

// Historical mean (1984-2022) in °C
var mean_historical = full_filtered
    .mean()
    .subtract(273.15) // Convert K to °C
    .clip(aoi_extent)
    .rename("MEAN_LST_C");

// 2022 mean in °C
var mean_2022 = year2022_filtered
    .mean()
    .subtract(273.15) // Convert K to °C
    .clip(aoi_extent)
    .rename("LST_2022_C");

// ------------------------------------------------------------------------
//  Calculate anomalies
// ------------------------------------------------------------------------

// Absolute anomaly in °C
var anomaly_abs = mean_2022
    .subtract(mean_historical)
    .rename("ANOMALY_ABS_C");

// Percentage anomaly
var anomaly_pct = mean_2022
    .subtract(mean_historical)
    .divide(mean_historical)
    .multiply(100)
    .rename("ANOMALY_PCT");

// ---------------------------------------------------------------------
//  Visualization with °C
// ---------------------------------------------------------------------

var tools = require('users/jhowarth/eePrimer:modules/image_tools.js');
var palettes = require('users/gena/packages:palettes');

// Visualization parameters
var lst_viz = {
    min: 30,  // ~86°F
    max: 50,  // ~122°F
    palette: palettes.colorbrewer.YlOrRd[9]
};

// MODIFIED PALETTES (inverted colors)
var anomaly_abs_viz = {
    min: -5,  // ~-9°F
    max: 5,   // ~9°F
    palette: palettes.colorbrewer.RdBu[11] // Removed .reverse()
};

var anomaly_pct_viz = {
    min: -15,
    max: 15,
    palette: palettes.colorbrewer.RdBu[11] // Removed .reverse()
};

// Add layers to map
Map.addLayer(mean_historical, lst_viz, "Mean LST 1984-2022 (°C)", false);
Map.addLayer(mean_2022, lst_viz, "Mean LST 2022 (°C)", false);
Map.addLayer(anomaly_abs, anomaly_abs_viz, "Anomaly 2022 (°C)", false);
Map.addLayer(anomaly_pct, anomaly_pct_viz, "Anomaly 2022 (%)", true);

// ---------------------------------------------------------------------
//  Add legends
// ---------------------------------------------------------------------

var cart = require('users/jhowarth/eePrimer:modules/cart.js');

Map.add(cart.makeGradientLegend(
    lst_viz,
    'Mean LST July-August (°C)',
    'bottom-right'
));

Map.add(cart.makeGradientLegend(
    anomaly_abs_viz,
    'LST Anomaly 2022\nAbsolute difference (°C)',
    'bottom-left'
));

Map.add(cart.makeGradientLegend(
    anomaly_pct_viz,
    'LST Anomaly 2022\nPercentage difference (%)',
    'bottom-left'
));

// ---------------------------------------------------------------------
//  Statistics and sampling
// ---------------------------------------------------------------------

// Create sample points within AOI
var samplePoints = ee.FeatureCollection.randomPoints({
  region: aoi_extent,
  points: 500,  // Reduced number for memory
  seed: 0
});

// Sample anomaly values
var sampledValues = anomaly_abs.sampleRegions({
  collection: samplePoints,
  scale: 30,
  geometries: false
});

// Calculate statistics
var anomalyStats = sampledValues.reduceColumns({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.stdDev(),
    sharedInputs: true
  }),
  selectors: ['ANOMALY_ABS_C']
});

print("2022 Anomaly Statistics (°C):", anomalyStats);

// Create histogram
var anomalyHist = ui.Chart.feature.histogram({
  features: sampledValues,
  property: 'ANOMALY_ABS_C',
  minBucketWidth: 0.5
}).setOptions({
  title: '2022 LST Anomaly Distribution (°C)',
  hAxis: {title: 'Anomaly (°C)'},
  vAxis: {title: 'Frequency'}
});

print(anomalyHist);

// --------------------------------------------------------------------------------
//  Additional checks
// --------------------------------------------------------------------------------

print("Historical images count:", full_filtered.size());
print("2022 images count:", year2022_filtered.size());

// Observation density
var observationDensity = full_filtered
    .map(function(image) { return image.mask().rename('count'); })
    .sum()
    .clip(aoi_extent);

Map.addLayer(observationDensity, {
    min: 0,
    max: 30,
    palette: ['blue', 'green', 'yellow', 'red']
}, "Observation Density 1984-2022", false);

// --------------------------------------------------------------------------------
//  Export Functions
// --------------------------------------------------------------------------------

// Export Anomaly Images as GeoTIFF
Export.image.toDrive({
  image: anomaly_abs,
  description: 'LST_Anomaly_Absolute_2022_C',
  scale: 30,
  region: aoi_extent,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF',
  formatOptions: {
    cloudOptimized: true
  }
});

Export.image.toDrive({
  image: anomaly_pct,
  description: 'LST_Anomaly_Percentage_2022',
  scale: 30,
  region: aoi_extent,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF',
  formatOptions: {
    cloudOptimized: true
  }
});

// Export Mean LST Images as GeoTIFF
Export.image.toDrive({
  image: mean_historical,
  description: 'Mean_LST_1984-2022_C',
  scale: 30,
  region: aoi_extent,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

Export.image.toDrive({
  image: mean_2022,
  description: 'Mean_LST_2022_C',
  scale: 30,
  region: aoi_extent,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

// Export Sampled Points as CSV
Export.table.toDrive({
  collection: sampledValues,
  description: 'LST_Anomaly_Samples_2022',
  fileFormat: 'CSV',
  selectors: ['ANOMALY_ABS_C']
});

// Export Observation Density
Export.image.toDrive({
  image: observationDensity,
  description: 'Observation_Density_1984-2022',
  scale: 30,
  region: aoi_extent,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

print('All export tasks have been configured. Please run them from the Tasks tab.');


// --------------------------------------------------------------------------------
// Zonal Statistics and Clustering for Anaplasma Points
// --------------------------------------------------------------------------------

// Assuming you have a FeatureCollection named 'anaplasma' with:
// - Geometry: Point locations
// - Properties: 
//   - 'Results Positive' (binary or continuous data)
//   - Other relevant fields

// 1. Extract LST anomaly values at anaplasma point locations
var anaplasmaWithAnomaly = anomaly_abs.sampleRegions({
  collection: anaplasma,
  scale: 30,
  geometries: true
});

// 2. Calculate zonal statistics
var zonalStats = anaplasmaWithAnomaly.reduceColumns({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.stdDev(),
    sharedInputs: true
  }).combine({
    reducer2: ee.Reducer.minMax(),
    sharedInputs: true
  }),
  selectors: ['ANOMALY_ABS_C', 'Results Positive']
});

print('Zonal Statistics for Anaplasma Points:', zonalStats);

// 3. Prepare data for clustering
// Filter only positive cases (assuming 'Results Positive' is binary 0/1)
var positiveCases = anaplasmaWithAnomaly.filter(ee.Filter.eq('Results Positive', 1));

// Create an array of features for clustering [LST anomaly, Other potential variables]
var clusterInput = positiveCases.map(function(feature) {
  var anomaly = ee.Number(feature.get('ANOMALY_ABS_C'));
  var result = ee.Number(feature.get('Results Positive'));
  return ee.Feature(null, {
    'anomaly': anomaly,
    'result': result
    // Add other relevant variables here
  });
});

// 4. Perform unsupervised clustering (K-means example)
var numClusters = 3; // Adjust based on your needs
var clusterer = ee.Clusterer.wekaKMeans(numClusters).train(clusterInput);

// Cluster the features
var clusteredPoints = clusterInput.cluster(clusterer);

// 5. Add cluster IDs to original points
var clusteredPositiveCases = positiveCases.map(function(feature) {
  var anomaly = ee.Number(feature.get('ANOMALY_ABS_C'));
  var result = ee.Number(feature.get('Results Positive'));
  var clusterFeature = ee.Feature(null, {
    'anomaly': anomaly,
    'result': result
  });
  var clusterId = clusterer.cluster(clusterFeature);
  return feature.set('cluster', clusterId);
});

// 6. Visualize clusters
Map.addLayer(clusteredPositiveCases.style({
  color: {
    property: 'cluster',
    mode: 'linear',
    palette: ['red', 'green', 'blue'], // Adjust colors as needed
    min: 0,
    max: numClusters-1
  },
  pointSize: 5
}), {}, 'Anaplasma Clusters by LST Anomaly');

// 7. Calculate cluster statistics
var clusterStats = clusteredPositiveCases.reduceColumns({
  reducer: ee.Reducer.mean().combine({
    reducer2: ee.Reducer.stdDev(),
    sharedInputs: true
  }).group({
    groupField: 1,
    groupName: 'cluster'
  }),
  selectors: ['ANOMALY_ABS_C', 'cluster']
});

print('Cluster Statistics:', clusterStats);

// 8. Export clustered points (optional)
Export.table.toDrive({
  collection: clusteredPositiveCases,
  description: 'Anaplasma_Clustered_Points',
  fileFormat: 'CSV',
  selectors: ['ANOMALY_ABS_C', 'Results Positive', 'cluster']
});
