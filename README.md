In this repository you will find the example scripts used in the article titled **CerMapp: Geospatial Cloud-Based Surveillance of Wildlife Diseases. A Prototype for National-Scale Monitoring under Geomatics and One Health Principles**

## Overview

This repository contains scripts for the computation, visualization, and statistical analysis of Land Surface Temperature (LST) anomalies, focusing on July–August 2022 relative to the 1984–2022 mean. The workflow is implemented in both Google Earth Engine (JavaScript) and R, enabling flexible geospatial analysis and integration with epidemiological or ecological point data.

## Contents

- **Google Earth Engine (`lst_anomalies.js`)**  
  Script for large-scale LST anomaly processing in Google Earth Engine.
- **R Script**  
  Utilities for advanced data processing and statistical analysis on the results exported from GEE.

## Features

### Google Earth Engine (`lst_anomalies.js`)

- **AOI Handling:** Uses geometry or asset for flexible area definition.
- **LST Calculation:** Fetches and harmonizes Landsat 5, 7, 8, 9 from 1984–2022.
- **Temporal Subsetting:** Historical (1984–2022) and target year (2022) for July–August.
- **Cloud Masking:** Advanced removal using QA_PIXEL band.
- **Anomalies:** Computes both absolute (°C) and percentage differences.
- **Visualization:** Interactive layers for mean values (historical and 2022), anomalies, and observation density.
- **Sampling & Stats:** Random sampling, descriptive stats, histograms, and observation density.
- **Exports:** GeoTIFFs (anomalies, means, density) and sampled data (CSV).
- **Integration with Point Data:** Anomaly extraction, zonal stats, clustering, cluster statistics, and exports for epidemiological studies.

### R Script

The R script is designed for advanced post-processing and analysis of LST anomaly data exported from GEE. It typically performs the following:

- **Import of Exported GeoTIFF/CSV Data:** Load LST anomaly rasters and sampled points.
- **Spatial Analysis:** Overlay and extract anomalies at point locations of interest (e.g., disease sites).
- **Descriptive & Inferential Statistics:** Compute summary statistics, test spatial patterns, and perform custom visualizations.
- **Advanced Visualizations:** Plot distributions, time series, or spatial maps of anomalies.
- **Clustering & Pattern Detection:** Apply statistical or machine learning methods to point-level anomaly measurements.

The R script is intended for users wanting customizable local analysis beyond the GEE platform. It is fully compatible with data exported by `lst_anomalies.js`.

## Usage Instructions

1. **In Google Earth Engine:**
   - Edit AOI as needed.
   - Run `lst_anomalies.js` to process LST data, visualize results, and configure exports (GeoTIFF, CSV).
   - Start export tasks in the GEE Tasks tab.
2. **In R:**
   - Download exported data from GEE.
   - Use the R script to:
     - Read and visualize rasters and sample tables.
     - Integrate anomaly data with epidemiological/point datasets.
     - Carry out further statistical analyses and customized plots.

## Requirements

- **Google Earth Engine account**  
- **AOI asset**: `"projects/izsgis-am/assets/VDA_INVA_OK_ED50"`
- **R with typical spatial/statistics packages** (e.g. raster, sf, tidyverse)
- (Optional) Point datasets for epidemiology or ecology

## Outputs

- **GeoTIFFs**: Anomaly rasters, mean LST rasters, observation density
- **CSVs**: Sampled anomaly values, clustered points
- **R Graphics**: Custom maps, plots, statistics
- **Map Layers**: Interactive visualization in GEE

## Notes

- Remember to update asset IDs and parameters as needed.
- The R script supplements the GEE workflow for post hoc, reproducible, and publication-ready analyses.

## Citation

If you use these scripts or modules, please cite the relevant script authors and module creators. For issues, suggestions, or collaboration, please contact Tommaso Orusa.

