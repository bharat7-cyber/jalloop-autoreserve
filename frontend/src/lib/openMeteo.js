
export const OPEN_METEO_URL = "https://open-meteo.com/";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function searchCities(query) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`City search failed (${response.status})`);
  }

  const data = await response.json();
  return data.results || [];
}

export async function fetchForecast(latitude, longitude) {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set(
    "hourly",
    "precipitation,precipitation_probability,temperature_2m"
  );
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Forecast request failed (${response.status})`);
  }

  return response.json();
}

export function computeNext24h(data) {
  const times = data.hourly?.time || [];
  const precipitation = data.hourly?.precipitation || [];
  const probabilities = data.hourly?.precipitation_probability || [];
  const temperatures = data.hourly?.temperature_2m || [];

  if (!times.length || !precipitation.length) {
    throw new Error("No hourly forecast data available");
  }

  // Start at the current forecast hour; use the next 24 hourly values.
  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);

  let startIndex = times.findIndex(
    (time) => new Date(time).getTime() >= currentHour.getTime()
  );

  if (startIndex < 0 || startIndex + 24 > times.length) {
    throw new Error("Forecast does not contain 24 upcoming hourly values");
  }

  const endIndex = startIndex + 24;
  const rainValues = precipitation.slice(startIndex, endIndex);
  const tempValues = temperatures.slice(startIndex, endIndex);
  const probabilityValues = probabilities.slice(startIndex, endIndex);

  const totalMm = Number(
    rainValues.reduce((sum, value) => sum + (Number(value) || 0), 0).toFixed(1)
  );

  const validTemps = tempValues.filter(Number.isFinite);
  const validProbabilities = probabilityValues.filter(Number.isFinite);

  return {
    totalMm,
    windowStart: times[startIndex],
    windowEnd: times[endIndex - 1],
    timezone: data.timezone || "UTC",
    peakProbability: validProbabilities.length
      ? Math.max(...validProbabilities)
      : null,
    tempMin: validTemps.length
      ? Math.min(...validTemps)
      : null,
    tempMax: validTemps.length
      ? Math.max(...validTemps)
      : null,
    units: {
      precipitation: data.hourly_units?.precipitation || "mm",
      probability: data.hourly_units?.precipitation_probability || "%",
      temperature: data.hourly_units?.temperature_2m || "°C",
    },
  };
}
