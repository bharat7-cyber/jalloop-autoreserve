import time
import math
import random
from datetime import datetime, timezone
from typing import Dict, Any
from .models import SensorTelemetry


class SensorSimulator:
    """
    Simulates high-fidelity building water IoT sensor network.
    Includes ultrasonic level transmitter, digital tipping rain gauge,
    electromagnetic flowmeters, and smart motorized throttling valve.
    """
    def __init__(self):
        self.sensor_id = "JL-BLDG-IOT-001"
        self.tank_capacity = 100_000.0
        self.current_water_level = 68_500.0
        self.valve_position = 0.0  # 0 to 100%
        self.rain_rate_mm_hr = 14.5
        self.cumulative_rain_mm = 28.2
        self.ambient_temp = 32.4
        self.humidity = 78.0
        self.last_update = time.time()
        self.simulated_mode = "AUTO"

    def get_current_telemetry(self) -> SensorTelemetry:
        """Returns realistic real-time telemetry with slight physical jitter."""
        now = time.time()
        dt = max(0.1, min(now - self.last_update, 10.0))
        self.last_update = now

        # Micro-fluctuations to emulate live sensor ADC readings
        jitter_level = random.uniform(-15.0, 15.0)
        self.current_water_level = max(0.0, min(self.tank_capacity, self.current_water_level + jitter_level))
        
        fill_pct = round((self.current_water_level / self.tank_capacity) * 100.0, 1)
        
        # Calculate dynamic flow based on rain rate and valve state
        # Inflow: rain_rate * (1200 sqm roof * 0.9 C) / 60 min -> LPM
        inflow_lpm = round(self.rain_rate_mm_hr * (1200.0 * 0.9) / 60.0, 1) if self.rain_rate_mm_hr > 0 else 0.0
        
        # Outflow: controlled drawdown valve discharge + building base demand
        outflow_lpm = round((self.valve_position / 100.0) * 180.0 + 8.5, 1)

        # Thermal comfort / heatwave index
        heatwave_index = "MODERATE"
        if self.ambient_temp >= 40.0:
            heatwave_index = "CRITICAL_HEATWAVE"
        elif self.ambient_temp >= 35.0:
            heatwave_index = "HIGH_HEATWAVE"
        elif self.rain_rate_mm_hr > 25.0:
            heatwave_index = "STORM_ACTIVE"

        storm_alert_active = self.rain_rate_mm_hr >= 20.0 or self.cumulative_rain_mm >= 40.0

        return SensorTelemetry(
            sensor_id=self.sensor_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            tank_level_liters=round(self.current_water_level, 1),
            tank_level_percentage=fill_pct,
            rain_rate_mm_hr=round(self.rain_rate_mm_hr, 1),
            cumulative_rain_mm=round(self.cumulative_rain_mm, 1),
            inflow_lpm=inflow_lpm,
            outflow_lpm=outflow_lpm,
            valve_position_pct=round(self.valve_position, 1),
            ambient_temp_c=round(self.ambient_temp, 1),
            humidity_pct=round(self.humidity, 1),
            heatwave_index=heatwave_index,
            storm_alert_active=storm_alert_active,
            status="ONLINE (Simulated Hardware Telemetry)"
        )

    def set_simulation_state(self, updates: Dict[str, Any]):
        """Allows user to trigger simulated weather events or valve changes."""
        if "rainfall_rate_mm_hr" in updates:
            self.rain_rate_mm_hr = float(updates["rainfall_rate_mm_hr"])
        if "cumulative_rain_mm" in updates:
            self.cumulative_rain_mm = float(updates["cumulative_rain_mm"])
        if "tank_level_liters" in updates:
            self.current_water_level = float(updates["tank_level_liters"])
        if "valve_position_pct" in updates:
            self.valve_position = float(updates["valve_position_pct"])
        if "ambient_temp_c" in updates:
            self.ambient_temp = float(updates["ambient_temp_c"])


sensor_simulator = SensorSimulator()
