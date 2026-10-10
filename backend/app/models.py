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
        description="Current water stored in primary tank in liters (L)"
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
        description="Target critical safety reserve days to preserve for dry periods / heatwaves"
    )
    secondary_tank_capacity_liters: float = Field(
        default=25000.0,
        ge=0.0,
        le=50_000_000.0,
        description="Available secondary storage / raw water cistern / percolation pit headroom in liters (L)"
    )
    planned_prestorm_consumption_liters: float = Field(
        default=0.0,
        ge=0.0,
        le=5_000_000.0,
        description="Scheduled on-site non-potable demand prior to storm arrival (HVAC thermal pre-cooling, irrigation, cistern fill) in liters (L)"
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
        capacity = info.data.get("tank_capacity_liters")

        if capacity is not None and v > capacity:
            raise ValueError(
            "Current water level cannot exceed tank capacity"
        )

        return v


class HourlyWaterForecast(BaseModel):
    hour: int
    rainfall_mm: float
    cumulative_runoff_liters: float
    projected_tank_level_liters: float
    overflow_liters: float


class DrawdownRouting(BaseModel):
    """
    Physical routing destinations for pre-storm drawdown water.
    Drawdown is never assumed to dump infinitely into overloaded drains.
    """
    drawdown_to_consumption_liters: float = Field(
        ...,
        description="Drawn-down volume allocated to scheduled pre-storm non-potable demand (HVAC, cistern fill)"
    )
    drawdown_to_secondary_tank_liters: float = Field(
        ...,
        description="Drawn-down volume transferred to secondary retention tank or dedicated groundwater recharge pit"
    )
    drawdown_to_controlled_discharge_liters: float = Field(
        ...,
        description="Remaining volume discharged at throttled rate strictly during the 4h pre-storm dry window"
    )
    drain_overload_risk_note: str = Field(
        ...,
        description="Operational note regarding municipal stormwater drain saturation"
    )
    unavoidable_overflow_liters: float = Field(
        ...,
        description="Volume of runoff that exceeds total facility storage (Primary headroom + Secondary capacity)"
    )
    overflow_explanation: str = Field(
        ...,
        description="Hydrological explanation of why overflow occurs or is zero"
    )


class WaterSavingsEstimate(BaseModel):
    """
    Water reuse, municipal tanker reduction, and demand allocation.
    """
    total_reusable_water_liters: float = Field(
        ...,
        description="Total net rainwater productively utilized: captured in primary tank + useful drawdown (no double counting)"
    )
    avoided_freshwater_tankers: float = Field(
        ...,
        description="Number of 10,000-liter municipal water tankers avoided"
    )
    estimated_cost_savings_inr: float = Field(
        ...,
        description="Estimated monetary savings in INR at benchmark ₹1,500 per 10kL tanker"
    )
    non_potable_breakdown: Dict[str, float] = Field(
        ...,
        description="Estimated non-potable demand allocation: HVAC cooling (40%), flushing (35%), irrigation (25%)"
    )
    assumptions: List[str] = Field(
        ...,
        description="Transparent mathematical and physical assumptions"
    )


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
        description="Pre-storm available headroom in primary tank: capacity - current_level"
    )
    recommended_drawdown_liters: float = Field(
        ...,
        description="Pre-storm release volume to prevent urban overflow while strictly guarding safety reserve"
    )
    post_drawdown_level_liters: float = Field(
        ...,
        description="Primary tank level after recommended drawdown prior to storm arrival"
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
    
    # Consistent autonomy figures derived from daily_water_demand_liters
    target_reserve_days: float = Field(
        ...,
        description="Target dry-period safety buffer days (equals inputs.reserve_days)"
    )
    current_autonomy_days: float = Field(
        ...,
        description="Days of building autonomy supported by current water level prior to storm"
    )
    post_rain_autonomy_days: float = Field(
        ...,
        description="Days the building can operate autonomously on the resulting post-rain water level"
    )
    days_of_autonomy_remaining: float = Field(
        ...,
        description="Alias for post_rain_autonomy_days for backward compatibility"
    )
    
    # Drawdown Destination & Unavoidable Overflow Modeling
    drawdown_to_consumption_liters: float = 0.0
    drawdown_to_secondary_tank_liters: float = 0.0
    drawdown_to_controlled_discharge_liters: float = 0.0
    drain_overload_risk_note: str = ""
    unavoidable_overflow_liters: float = 0.0
    overflow_explanation: str = ""
    drawdown_routing: Optional[DrawdownRouting] = None

    # Water Reuse & Financial Savings
    total_reusable_water_liters: float = 0.0
    avoided_freshwater_tankers: float = 0.0
    estimated_cost_savings_inr: float = 0.0
    non_potable_breakdown: Optional[Dict[str, float]] = None
    water_savings: Optional[WaterSavingsEstimate] = None

    # Strategy Advisory
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
    Simulated building IoT telemetry stream (synthetic ADC modeling for demo).
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
