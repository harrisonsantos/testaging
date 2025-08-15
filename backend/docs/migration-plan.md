# Migration Plan for Business Calculations from Frontend to Backend

## Overview
This document outlines the plan to migrate business calculations from the frontend to the backend, ensuring full functional compatibility.

## Identified Frontend Files with Calculations
1. `frontend/src/components/pages/evaluations/sensor-data/BarChart.jsx`
   - Calculates time in seconds from formatted strings
   - Processes evaluation data for bar charts

2. `frontend/src/components/pages/evaluations/sensor-data/ContinuityChart.jsx`
   - Calculates reference data for continuity charts
   - Determines ideal and bad time thresholds
   - Plots patient data against reference metrics

3. `frontend/src/components/pages/evaluations/sensor-data/FadigaAreaChart.jsx`
   - Calculates fatigue percentage based on power measurements
   - Processes data for area chart visualization

## Planned Backend Implementation
1. RESTful endpoints for each calculation:
   - `GET /api/evaluations/barchart`
   - `GET /api/evaluations/continuitychart`
   - `GET /api/evaluations/fadigachart`

2. Input/Output Specifications:
   - All calculations will return JSON data with the same structure as frontend inputs
   - Error handling will be implemented for invalid inputs
   - Logging will be added for debugging purposes

3. Validation:
   - Input validation for all parameters
   - Output validation to ensure data integrity

## Next Steps
1. Implement backend services in NestJS
2. Update frontend to use backend endpoints
3. Conduct thorough testing
4. Document changes and prepare for deployment

## Timeline
- Backend implementation: [Not specified]
- Frontend updates: [Not specified]
- Testing: [Not specified]
- Deployment: [Not specified]
