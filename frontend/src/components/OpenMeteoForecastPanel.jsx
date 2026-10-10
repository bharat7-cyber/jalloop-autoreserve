import { useState } from "react";
import { searchCities, fetchForecast, computeNext24h, OPEN_METEO_URL } from "../lib/openMeteo";

const box = { border: "1px solid #ccc", borderRadius: 8, padding: 12, margin: "12px 0" };

/**
 * Props:
 *  onApply(rainfallMm: number, info) - parent fills the existing rainfall input and recalculates.
 * This component never touches the manual rainfall input.
 */
export default function OpenMeteoForecastPanel({ onApply }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [city, setCity] = useState(null);
  const [summary, setSummary] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  const cityLabel = (c) => [c.name, c.admin1, c.country].filter(Boolean).join(", ");

  const handleSearch = async () => {
    setError("");
    try {
      const found = await searchCities(query);
      setResults(found);
      if (!found.length) setError("No matching city found. You can still enter rainfall manually.");
    } catch {
      setResults([]);
      setError("City search failed. Enter rainfall manually.");
    }
  };

  const selectCity = (c) => {
    setCity(c);
    setResults([]);
    setSummary(null); // clear so a forecast for another city can't be applied
    setApplied(false);
    setError("");
  };

  const handleFetch = async () => {
    if (!city) return;
    setLoading(true);
    setError("");
    setApplied(false);
    try {
      const data = await fetchForecast(city.latitude, city.longitude);
      setSummary(computeNext24h(data));
      setFetchedAt(new Date());
    } catch (e) {
      setSummary(null);
      setError(`Weather forecast unavailable (${e.message}). Enter rainfall manually.`);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!summary || !city) return;
    onApply(summary.totalMm, {
      provider: "Open-Meteo",
      city: cityLabel(city),
      windowStart: summary.windowStart,
      windowEnd: summary.windowEnd,
      fetchedAt: fetchedAt?.toISOString(),
    });
    setApplied(true);
  };

  return (
    <div style={box}>
      <strong>Weather forecast (Open-Meteo)</strong>

      <div style={{ margin: "8px 0" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search city"
          aria-label="Search city"
        />{" "}
        <button type="button" onClick={handleSearch}>Search</button>
      </div>

      {results.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "8px 0" }}>
          {results.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => selectCity(c)}>{cityLabel(c)}</button>
            </li>
          ))}
        </ul>
      )}

      {city && <p style={{ margin: "4px 0" }}>Selected city: {cityLabel(city)}</p>}

      <button type="button" onClick={handleFetch} disabled={!city || loading}>
        {loading ? "Fetching…" : "Fetch Weather Forecast"}
      </button>

      {error && <p role="alert" style={{ color: "#b00020" }}>{error}</p>}

      {summary && (
        <div style={{ margin: "8px 0" }}>
          <p style={{ fontSize: 12, margin: "4px 0" }}>
            Forecast data (not observed rainfall) · Provider: Open-Meteo · Forecast fetched at{" "}
            {fetchedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
          </p>
          <p style={{ fontSize: 12, margin: "4px 0" }}>
            Window: next 24 hourly values, {summary.windowStart} to {summary.windowEnd} ({summary.timezone})
          </p>
          <div>City: {cityLabel(city)}</div>
          <div>Expected rainfall (next 24 h): {summary.totalMm} {summary.units.precipitation}</div>
          <div>
            Rain probability (peak hourly):{" "}
            {summary.peakProbability != null ? `${summary.peakProbability}${summary.units.probability}` : "n/a"}
          </div>
          <div>
            Temperature:{" "}
            {summary.tempMin != null
              ? `${summary.tempMin}–${summary.tempMax} ${summary.units.temperature}`
              : "n/a"}
          </div>
          <button type="button" onClick={handleApply} style={{ marginTop: 8 }}>Apply Forecast</button>
          {applied && (
            <span style={{ marginLeft: 8 }}>
              Applied {summary.totalMm} mm. You can still edit the rainfall manually.
            </span>
          )}
        </div>
      )}

      <p style={{ fontSize: 12, margin: "8px 0 0" }}>
        Weather data by{" "}
        <a href={OPEN_METEO_URL} target="_blank" rel="noopener noreferrer">Open-Meteo.com</a>
      </p>
    </div>
  );
}