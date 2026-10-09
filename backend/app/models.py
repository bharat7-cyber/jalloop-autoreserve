from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class WaterSystemInput(BaseModel):
    """
    Physical and meteorological parameters for building water management.
    """
    rainfall_mm: float = Field(
        ...,
        ge=0.0,
        le=1000.0,
        description="Forecasted or actual rainfall depth in millimeters (mm)"
    )
    catchment_area_sqm: float = Field(
        ...,
        gt=0.0,
        le=1_000_000.0,
        description="Effective catchment/roof area in square meters (m²)"
    )
    runoff_coefficient: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Runoff coefficient C (e.g. 0.85-0.95 for concrete/metal, 0.5 for green roof)"
    )
    tank_capacity_liters: float = Field(
        ...,
        gt=0.0,
        le=50_000_000.0,
        description="Total primary storage tank capacity in liters (L)"
    )
    current_water_level_liters: float = Field(
        ...,
        ge=0.0,
        description="Current water stored in tank in liters (L)"
    )
    daily_water_demand_liters: float = Field(
        ...,
        ge=0.0,
        le=10_000_000.0,
        description="Average building daily non-potable/potable consumption in liters (L/day)"
    )
    reserve_days: float = Field(
        default=3.0,
        ge=0.0,
        le=60.0,
        description="Target critical buffer days to preserve for dry periods / heatwaves"
    )
    scenario_name: Optional[str] = Field(
        default="Standard Building Run",
        description="Optional human-readable label or building identifier"
    )
    forecast_hours: Optional[float] = Field(
        default=24.0,
        ge=1.0,
        le=168.0,
        description="Forecast horizon window in hours"
    )

    @field_validator("current_water_level_liters")
    @classmethod
    def validate_current_level_vs_capacity(cls, v: float, info) -> float:
        # Note: if current level exceeds capacity (abnormal overfill), we allow calculation but cap it in logic
        return v


class HourlyWaterForecast(BaseModel):
    hour: int
    rainfall_mm: float
    cumulative_runoff_liters: float
    projected_tank_level_liters: float
    overflow_liters: float


class CalculationResult(BaseModel):
    """
    Comprehensive output from the JalLoop AutoReserve mathematical engine.
    """
    id: str
    timestamp: str
    inputs: WaterSystemInput
    
    # Runoff and balance
    harvestable_runoff_liters: float = Field(
        ...,
        description="Total predicted runoff volume: rainfall_mm * catchment_area_sqm * runoff_coefficient (1 mm * 1 m² = 1 L)"
    )
    safety_reserve_liters: float = Field(
        ...,
        description="Minimum critical volume that must never be drawn down: daily_demand * reserve_days"
    )
    available_storage_liters: float = Field(
        ...,
        description="Pre-storm available headroom in tank: capacity - current_level"
    )
    recommended_drawdown_liters: float = Field(
        ...,
        description="Pre-storm controlled release volume to prevent urban overflow while guarding safety reserve"
    )
    post_drawdown_level_liters: float = Field(
        ...,
        description="Tank level after recommended drawdown prior to storm arrival"
    )
    captured_water_liters: float = Field(
        ...,
        description="Actual volume of runoff retained into the storage tank"
    )
    overflow_liters: float = Field(
        ...,
        description="Water lost or spilled to municipal storm mains due to capacity limits"
    )
    overflow_risk_percentage: float = Field(
        ...,
        description="Proportion of incoming runoff that risks overflowing (0-100%)"
    )
    post_rain_tank_level_liters: float = Field(
        ...,
        description="Final anticipated water level in liters after rain event"
    )
    post_rain_fill_percentage: float = Field(
        ...,
        description="Tank fullness percentage after storm event (0-100%)"
    )
    days_of_autonomy_remaining: float = Field(
        ...,
        description="Days the building can operate autonomously on the resulting post-rain water level"
    )
    
    # Smart Advisory
    mode: str = Field(
        ...,
        description="Operational strategy: 'HEATWAVE_DEFENSE', 'STORM_SURGE_PREP', 'BALANCED_BUFFER', or 'CONSERVATION_ALERT'"
    )
    alert_level: str = Field(
        ...,
        description="Severity: 'NORMAL', 'ADVISORY', 'WARNING', or 'CRITICAL'"
    )
    valve_action: str = Field(
        ...,
        description="Actuator instruction: 'KEEP_CLOSED', 'CONTROLLED_DISCHARGE', 'MAX_HARVEST_OPEN', or 'EMERGENCY_BYPASS'"
    )
    valve_discharge_rate_lpm: float = Field(
        ...,
        description="Recommended valve discharge flow rate in Liters Per Minute (LPM) over 4 hours pre-storm"
    )
    recommendations: List[str] = Field(
        ...,
        description="List of actionable human and automated recommendations"
    )
    
    # Audit & Storage metadata
    storage_backend: str = Field(
        ...,
        description="'dynamodb' if stored in AWS DynamoDB, or 'sqlite' for local persistence"
    )
    hourly_projection: Optional[List[HourlyWaterForecast]] = None


class SensorTelemetry(BaseModel):
    """
    Live or simulated building IoT telemetry stream.
    """
    sensor_id: str
    timestamp: str
    tank_level_liters: float
    tank_level_percentage: float
    rain_rate_mm_hr: float
    cumulative_rain_mm: float
    inflow_lpm: float
    outflow_lpm: float
    valve_position_pct: float
    ambient_temp_c: float
    humidity_pct: float
    heatwave_index: str
    storm_alert_active: bool
    status: str


class SystemHealth(BaseModel):
    status: str
    app_name: str
    version: str
    aws_dynamodb_configured: bool
    aws_region: Optional[str] = None
    dynamodb_table: Optional[str] = None
    persistence_mode: str
    total_records_stored: int
