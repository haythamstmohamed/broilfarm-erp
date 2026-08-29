# Broiler Consumption Forecast Sources

## Reference baseline

The dashboard forecast will use a published **Cobb 500 performance baseline** for daily feed consumption by age. It is presented as a planning reference, not a universal production guarantee: actual intake changes with strain, sex, feed formulation, temperature, ventilation, health status, stocking density, and management.

For forecast water, the application will use an explicit default **water-to-feed ratio of 1.7 litres per kilogram of feed** as a temperate-condition planning assumption. Aviagen guidance cited through the PoultrySite reports an expected water-to-feed range of **1.6–1.8:1 at 21°C**; the implementation will expose the ratio as a clearly labelled assumption rather than a clinical or veterinary prescription.

## Sources

1. Cobb-Vantress, [Learning Center / Broiler Management Guide](https://www.cobbgenetics.com/en_US/resources), accessed 2026-08-18. The official resource center provides Cobb broiler management and performance-reference materials.
2. Aviagen, [Info Center](https://aviagen.com/na/tech-center/search?Language=36&start=30), accessed 2026-08-18. The official technical resource catalogue provides Ross/Aviagen management and nutrition resources.
3. The PoultrySite, [Water utilisation in broilers](https://www.thepoultrysite.com/articles/water-utilisation-in-broilers-1), accessed 2026-08-18. It reports Aviagen's 1.6–1.8:1 water-to-feed guidance at 21°C.

## Product constraints

- Forecasts must never be described as a 100% guarantee or a replacement for veterinary or nutritionist oversight.
- Feed is converted to bags using the farm's labelled bag-weight assumption, initially 50 kg, and the UI must make that assumption visible.
- Per-house values use the current cycle occupancy of cage sections inside that house. Empty or unassigned houses show no forecast rather than fabricated consumption.
