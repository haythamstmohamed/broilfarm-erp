# Weather Data Source

The farm weather integration uses the Open-Meteo Weather Forecast API for current and forecast conditions, and the Open-Meteo Historical Weather API for prior production-cycle days.

The implementation queries by the farm's WGS84 latitude and longitude, sets the provider timezone to `auto`, and requests daily weather code, maximum and minimum temperature, maximum wind speed, plus humidity data. Historical synchronization uses the archive endpoint for dates before today.

Sources:

- https://open-meteo.com/en/docs
- https://open-meteo.com/en/docs/historical-weather-api
