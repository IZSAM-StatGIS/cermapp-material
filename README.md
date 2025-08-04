In this repository you will find the example scripts used in the article titled **CerMapp: Geospatial Cloud-Based Surveillance of Wildlife Diseases. A Prototype for National-Scale Monitoring under Geomatics and One Health Principles**

# LST Anomalies 2022 (Google Earth Engine)

**Author:** Tommaso Orusa  
**Contact:** t.orusa@izs.it, tommaso.orusa@gmail.com  
**Date:** 08/07/2025 (dd-mm-yyyy)

## Overview

This script computes and visualizes Land Surface Temperature (LST) anomalies for the period July–August 2022 compared to the 1984–2022 historical mean, using Landsat satellite imagery processed in Google Earth Engine (GEE). It allows the export of results, statistical analyses, and the integration of LST anomalies with point datasets (e.g., disease occurrences) for clustering and zonal statistics.

## Main Features

- **Automatic AOI Selection:** Flexible definition of Area of Interest (AOI) via geometry or imported asset.
- **Multi-Sensor LST Calculation:** Utilizes Landsat 5, 7, 8, and 9 with harmonized LST computation ([S. Ermida's module](https://code.earthengine.google.com/?scriptPath=users/sofiaermida/landsat_smw_lst:modules/Landsat_LST)).
- **Temporal Subsetting:**  
  - *Historical mean*: July-August, 1984–2022  
  - *Target year*: July-August, 2022
- **Cloud Masking:** Uses the QA_PIXEL band for rigorous cloud removal.
- **Anomaly Calculation:**  
  - *Absolute anomaly:* Mean 2022 LST minus historical mean (°C)  
  - *Percent anomaly:* Relative to historical mean (%)
- **Visualization:**  
  - LST maps with color palettes  
  - Absolute/percentage anomaly maps  
  - Interactive color legends
- **Statistics & Sampling:**  
  - Random sampling (500 points) for histograms/statistics  
  - Mean and stddev for anomalies  
  - Observation density maps
- **Exporting:**  
  - GeoTIFFs of results  
  - Sampled points (CSV)  
  - Observation density
- **Integration:**  
  - Attach anomaly values to external point datasets (e.g., epidemiological data)  
  - Zonal statistics  
  - K-means clustering and cluster statistics  
  - Visualization of clusters

## Usage Instructions

1. **Set Area of Interest:**  
   Update the `geometry` or AOI asset as needed.
2. **Load Required Modules:**  
   The script requires external GEE modules:
   - `users/sofiaermida/landsat_smw_lst:modules/Landsat_LST.js`
   - `users/jhowarth/eePrimer:modules/image_tools.js`
   - `users/gena/packages:palettes`
   - `users/jhowarth/eePrimer:modules/cart.js`
3. **Run All Cells:**  
   Use the GEE Code Editor. Visualization layers and statistics will be printed to the console and map.
4. **Export Results:**  
   Configure export tasks in the GEE “Tasks” tab and start them manually.

## Requirements

- **Google Earth Engine account**
- **AOI asset**: `"projects/izsgis-am/assets/VDA_INVA_OK_ED50"`
- **(Optional)**: FeatureCollection (e.g., `anaplasma`) for clustering/statistics

## Notes

- AOI and sample sizes can be adjusted in the script for performance.
- All LST values are converted from Kelvin to Celsius before analysis.
- The cluster and statistical analyses for external point datasets are optional and require the user to supply a suitable FeatureCollection named `anaplasma` with relevant properties.

## Outputs

- **GeoTIFFs:** Absolute/percent anomalies, mean LSTs, observation density
- **CSV:** Sampled anomalies, clustered point attributes
- **Map Layers:** Interactive, with color-coded legends
- **Console:** Summary statistics, histograms, image counts

### Citation

Please reference the included module authors if using LST computation or palettes in published work. For script-related queries or collaboration, contact Tommaso Orusa.

**Enjoy anomaly mapping with GEE!**
