
# Field Shift 🌍🌱

### Adaptive Agricultural Intelligence Powered by NASA Earth Observations

**Field Shift** is an agricultural intelligence and decision-support platform that combines NASA Earth observation data, machine learning, statistical analysis, agricultural science and farmer knowledge to help farmers explore more resilient farming strategies.

Our goal is to transform environmental data into actionable agricultural insights, helping farmers understand changing environmental conditions, discover potential agricultural opportunities and make more informed crop-rotation decisions.

> Farmers remain at the centre of every decision. Field Shift is designed to support agricultural expertise, not replace it.

---

## 🌍 The Problem

Agriculture is increasingly affected by changing environmental conditions, including:

- Unpredictable rainfall patterns.
- Rising temperatures and heat stress.
- Soil moisture variability.
- Water availability challenges.
- Changing vegetation and environmental conditions.
- Declining soil health and unsustainable farming practices.

These challenges make it increasingly difficult for farmers to determine which crops to grow, when to grow them and which crop-rotation strategies may improve long-term agricultural resilience.

Although Earth observation satellites provide valuable environmental information, translating these observations into locally relevant agricultural decisions remains challenging.

**Field Shift aims to bridge this gap.**

## 💡 Our Solution

Field Shift is designed as an adaptive agricultural intelligence system with two interconnected learning components:

### 1. Environmental Intelligence

Uses NASA Earth observation datasets and machine-learning techniques to:

- Identify environmental patterns.
- Detect unusual environmental conditions.
- Analyse rainfall and temperature trends.
- Explore soil moisture and vegetation behaviour.
- Discover relationships between environmental variables.
- Investigate potential environmental changes and emerging patterns.

### 2. Agricultural Intelligence

Combines environmental insights with agricultural knowledge and local information to:

- Evaluate crop suitability.
- Explore alternative crop-rotation strategies.
- Assess potential environmental and agricultural risks.
- Compare farming strategies against existing practices.
- Incorporate farmer priorities and expert knowledge.
- Evaluate agricultural outcomes as reliable field observations become available.

### 3. Intelligence Fusion

The two systems work together through an intelligence layer that combines:

- Validated machine-learning outputs.
- Statistical findings.
- Agricultural knowledge.
- Local soil and crop information.
- Farmer observations and preferences.
- Uncertainty and data-quality assessments.

The result is an explainable decision-support process rather than an unexplained automated recommendation.

---

## 🧠 Machine Learning & Intelligence

Field Shift is designed around custom-trained machine-learning models using environmental datasets and agricultural information.

Our initial model portfolio includes:

| Capability                           | Proposed approach              |
| ------------------------------------ | ------------------------------ |
| Environmental anomaly detection      | Isolation Forest               |
| Environmental pattern discovery      | K-means clustering             |
| Rainfall and temperature forecasting | Statistical time-series models |
| Environmental relationships          | Regression analysis            |
| Crop suitability                     | Agricultural knowledge + ML    |
| Crop-rotation assessment             | Hybrid intelligence approach   |

Models will be trained and evaluated against appropriate datasets and baselines.

We distinguish between environmental patterns, agricultural predictions and experimentally validated farming outcomes. NASA observations alone are not treated as ground truth for crop yields or rotation success.

## 🛰️ Data Sources

Field Shift is designed to integrate Earth observation datasets and relevant agricultural information.

| Data source            | Intended application                       |
| ---------------------- | ------------------------------------------ |
| NASA POWER             | Meteorological and environmental variables |
| GPM IMERG              | Precipitation and rainfall analysis        |
| NASA SMAP              | Surface soil moisture observations         |
| Landsat                | Vegetation and land-surface analysis       |
| Local soil information | Soil characteristics and fertility         |
| Agricultural knowledge | Crop requirements and rotation principles  |
| Farmer observations    | Local experience and field outcomes        |

Data availability, temporal coverage, spatial resolution, quality flags and product versions will be considered throughout the analysis pipeline.

## 🌱 Initial Agricultural Focus

Our initial geographical focus is&#x20;**&#x20;Ashanti Region, Ghana**.





## 🔬 Farmer-Centred Adaptive Learning

A key part of Field Shift is its approach to learning from agricultural decisions and their outcomes.

The intended feedback process is:

1. Analyse environmental and agricultural information.
2. Present findings and possible strategies.
3. Allow farmers and agricultural experts to evaluate the options.
4. Record the decisions made and the reasons behind them.
5. Collect observations about the resulting farming outcomes.
6. Evaluate the reliability and relevance of the collected evidence.
7. Incorporate validated observations into future model-development cycles.

Not every observation automatically becomes a training label. Outcomes must be evaluated in context, accounting for factors such as pests, management practices, rainfall, soil conditions and seed quality.

Farmer experience is treated as valuable evidence, even when an observation has not yet been scientifically validated.

## 🏗️ Technical Architecture

Field Shift follows a modular architecture that separates data acquisition, processing, machine learning, agricultural intelligence and decision support.

**High-level workflow:**

```text
NASA Earth Observation Data
          |
          v
   Data Acquisition
          |
          v
 Data Quality & Processing
          |
          v
  Feature Engineering
          |
          v
  +---------------------+
  | Environmental ML    |
  | Agricultural ML     |
  | Statistical Analysis|
  +---------------------+
          |
          v
  Intelligence Fusion
          |
          v
 Agricultural Assessment
          |
          v
 Decision Support System
          |
          v
 Farmer & Expert Feedback
          |
          v
 Evidence Evaluation
          |
          v
 Controlled Model Improvement
```

### Technology Stack

| Component             | Technology                  |
| --------------------- | --------------------------- |
| Frontend              | React, TypeScript           |
| Styling               | Tailwind CSS                |
| Backend               | Python, FastAPI             |
| Machine Learning      | Scikit-learn                |
| Data Processing       | Pandas, NumPy               |
| Geospatial Processing | GeoPandas, Rasterio, xarray |
| Statistical Analysis  | SciPy, Statsmodels          |
| Visualisation         | Recharts, Matplotlib        |
| Mapping               | Leaflet                     |
| Database              | PostgreSQL, PostGIS         |

The technology stack represents the intended implementation architecture; individual components may evolve during development.

## 🔍 Scientific Integrity & Explainability

Field Shift aims to make its findings understandable and traceable.

Every analytical finding should communicate:

- What was observed.
- Which datasets were used.
- The relevant spatial and temporal coverage.
- Which analytical method was applied.
- What the result suggests.
- How uncertain the finding is.
- What limitations apply.
- What additional evidence or expert validation is needed.

We distinguish between:

- Established scientific evidence.
- Data-derived statistical findings.
- Farmer-reported observations.
- Unverified hypotheses.
- Expert-validated insights.

Correlation is not treated as proof of causation, and satellite observations are not presented as exact farm-level measurements when their spatial resolution does not support that interpretation.

## 🎯 Project Objectives

Field Shift aims to:

1. Make Earth observation data more useful for agricultural decision-making.
2. Discover environmental patterns that may be relevant to farming.
3. Explore resilient crop-rotation strategies.
4. Integrate scientific knowledge with local agricultural experience.
5. Develop an adaptive learning framework informed by verified field outcomes.
6. Improve the accessibility and explainability of agricultural intelligence.

## 🚧 Development Status

Field Shift is being developed as part of the **NASA Space Apps Challenge 2026**.

The current development focus is establishing the data-to-intelligence pipeline, integrating relevant NASA datasets, developing and evaluating machine-learning models, and demonstrating agricultural decision-support capabilities.

This is an evolving project. Planned capabilities should not be interpreted as completed or scientifically validated features.

**Better environmental intelligence. Better agricultural decisions. More resilient farming communities.**

---

## 🏆 Challenge

**NASA Space Apps Challenge 2026**

Challenge: *Field Shift: Adapting Farms with NASA Data*



## 📚 Data & References

- [NASA Earthdata](https://www.earthdata.nasa.gov/)
- [NASA POWER](https://power.larc.nasa.gov/)
- [NASA Global Precipitation Measurement (GPM)](https://gpm.nasa.gov/data)
- [NASA Soil Moisture Active Passive (SMAP)](https://smap.jpl.nasa.gov/)
- [NASA Landsat](https://landsat.gsfc.nasa.gov/)

## 📄 License

License and attribution details will be specified as the project develops. NASA datasets retain their respective usage and attribution requirements.

---

**Field Shift — Turning Earth observations into agricultural intelligence.**
