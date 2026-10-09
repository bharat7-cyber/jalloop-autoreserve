import os
import json
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

from .models import CalculationResult, WaterSystemInput, HourlyWaterForecast, SystemHealth

# Database configuration
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "jalloop.db"))
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "JalLoopCalculations")


class StorageManager:
    """
    Dual-mode persistence layer.
    Connects to AWS DynamoDB if configured with valid AWS credentials.
    Falls back gracefully and transparently to SQLite if AWS is unconfigured.
    """
    def __init__(self):
        self.sqlite_path = os.path.abspath(SQLITE_DB_PATH)
        self.dynamodb_table_name = DYNAMODB_TABLE_NAME
        self.aws_region = AWS_REGION
        self.is_dynamodb_active = False
        self.dynamo_table = None

        self._init_sqlite()
        self._try_init_dynamodb()

    def _init_sqlite(self):
        """Initializes SQLite tables for local audit logging."""
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
        with sqlite3.connect(self.sqlite_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS calculations (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    scenario_name TEXT,
                    rainfall_mm REAL,
                    catchment_area_sqm REAL,
                    runoff_coefficient REAL,
                    tank_capacity_liters REAL,
                    current_water_level_liters REAL,
                    daily_water_demand_liters REAL,
                    reserve_days REAL,
                    harvestable_runoff_liters REAL,
                    safety_reserve_liters REAL,
                    available_storage_liters REAL,
                    recommended_drawdown_liters REAL,
                    post_drawdown_level_liters REAL,
                    captured_water_liters REAL,
                    overflow_liters REAL,
                    overflow_risk_percentage REAL,
                    post_rain_tank_level_liters REAL,
                    post_rain_fill_percentage REAL,
                    days_of_autonomy_remaining REAL,
                    mode TEXT,
                    alert_level TEXT,
                    valve_action TEXT,
                    valve_discharge_rate_lpm REAL,
                    recommendations TEXT,
                    hourly_projection TEXT,
                    storage_backend TEXT
                )
            """)
            conn.commit()

    def _try_init_dynamodb(self):
        """Attempts connection to AWS DynamoDB if credentials exist."""
        if not BOTO3_AVAILABLE:
            self.is_dynamodb_active = False
            return

        aws_key = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
        
        # Only attempt if credentials or running inside AWS Lambda / EC2 instance profile
        if aws_key or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
            try:
                session = boto3.Session(region_name=self.aws_region)
                dynamodb = session.resource("dynamodb")
                table = dynamodb.Table(self.dynamodb_table_name)
                # Quick lightweight check to verify table exists
                table.load()
                self.dynamo_table = table
                self.is_dynamodb_active = True
            except Exception:
                # AWS credentials invalid or table doesn't exist yet
                self.is_dynamodb_active = False
                self.dynamo_table = None
        else:
            self.is_dynamodb_active = False

    def save_calculation(self, result: CalculationResult) -> str:
        """
        Saves calculation result to active storage.
        Returns 'dynamodb' or 'sqlite'.
        """
        # 1. Always save to local SQLite for zero-loss offline logging
        try:
            with sqlite3.connect(self.sqlite_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO calculations (
                        id, timestamp, scenario_name, rainfall_mm, catchment_area_sqm,
                        runoff_coefficient, tank_capacity_liters, current_water_level_liters,
                        daily_water_demand_liters, reserve_days, harvestable_runoff_liters,
                        safety_reserve_liters, available_storage_liters, recommended_drawdown_liters,
                        post_drawdown_level_liters, captured_water_liters, overflow_liters,
                        overflow_risk_percentage, post_rain_tank_level_liters, post_rain_fill_percentage,
                        days_of_autonomy_remaining, mode, alert_level, valve_action,
                        valve_discharge_rate_lpm, recommendations, hourly_projection, storage_backend
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    result.id,
                    result.timestamp,
                    result.inputs.scenario_name,
                    result.inputs.rainfall_mm,
                    result.inputs.catchment_area_sqm,
                    result.inputs.runoff_coefficient,
                    result.inputs.tank_capacity_liters,
                    result.inputs.current_water_level_liters,
                    result.inputs.daily_water_demand_liters,
                    result.inputs.reserve_days,
                    result.harvestable_runoff_liters,
                    result.safety_reserve_liters,
                    result.available_storage_liters,
                    result.recommended_drawdown_liters,
                    result.post_drawdown_level_liters,
                    result.captured_water_liters,
                    result.overflow_liters,
                    result.overflow_risk_percentage,
                    result.post_rain_tank_level_liters,
                    result.post_rain_fill_percentage,
                    result.days_of_autonomy_remaining,
                    result.mode,
                    result.alert_level,
                    result.valve_action,
                    result.valve_discharge_rate_lpm,
                    json.dumps(result.recommendations),
                    json.dumps([h.model_dump() for h in (result.hourly_projection or [])]),
                    result.storage_backend,
                ))
                conn.commit()
        except Exception as e:
            print(f"[Warning] Failed to write to SQLite: {e}")

        # 2. If AWS DynamoDB is active, write to DynamoDB
        if self.is_dynamodb_active and self.dynamo_table:
            try:
                from decimal import Decimal
                # Convert floats to Decimals for DynamoDB
                item = json.loads(json.dumps(result.model_dump()), parse_float=Decimal)
                self.dynamo_table.put_item(Item=item)
                return "dynamodb"
            except Exception as e:
                print(f"[Warning] Failed to write to DynamoDB: {e}")
                return "sqlite"

        return "sqlite"

    def get_history(self, limit: int = 50) -> List[CalculationResult]:
        """Retrieves recent calculation history."""
        # If DynamoDB is active, attempt scan/query
        if self.is_dynamodb_active and self.dynamo_table:
            try:
                response = self.dynamo_table.scan(Limit=limit)
                items = response.get("Items", [])
                results: List[CalculationResult] = []
                for item in items:
                    # Convert Decimals back to float
                    item_json = json.loads(json.dumps(item, default=float))
                    results.append(CalculationResult(**item_json))
                results.sort(key=lambda x: x.timestamp, reverse=True)
                return results[:limit]
            except Exception as e:
                print(f"[Warning] Failed to read from DynamoDB, falling back to SQLite: {e}")

        # Read from SQLite
        results: List[CalculationResult] = []
        try:
            with sqlite3.connect(self.sqlite_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM calculations ORDER BY timestamp DESC LIMIT ?
                """, (limit,))
                rows = cursor.fetchall()
                for row in rows:
                    rec = CalculationResult(
                        id=row["id"],
                        timestamp=row["timestamp"],
                        inputs=WaterSystemInput(
                            rainfall_mm=row["rainfall_mm"],
                            catchment_area_sqm=row["catchment_area_sqm"],
                            runoff_coefficient=row["runoff_coefficient"],
                            tank_capacity_liters=row["tank_capacity_liters"],
                            current_water_level_liters=row["current_water_level_liters"],
                            daily_water_demand_liters=row["daily_water_demand_liters"],
                            reserve_days=row["reserve_days"],
                            scenario_name=row["scenario_name"],
                        ),
                        harvestable_runoff_liters=row["harvestable_runoff_liters"],
                        safety_reserve_liters=row["safety_reserve_liters"],
                        available_storage_liters=row["available_storage_liters"],
                        recommended_drawdown_liters=row["recommended_drawdown_liters"],
                        post_drawdown_level_liters=row["post_drawdown_level_liters"],
                        captured_water_liters=row["captured_water_liters"],
                        overflow_liters=row["overflow_liters"],
                        overflow_risk_percentage=row["overflow_risk_percentage"],
                        post_rain_tank_level_liters=row["post_rain_tank_level_liters"],
                        post_rain_fill_percentage=row["post_rain_fill_percentage"],
                        days_of_autonomy_remaining=row["days_of_autonomy_remaining"],
                        mode=row["mode"],
                        alert_level=row["alert_level"],
                        valve_action=row["valve_action"],
                        valve_discharge_rate_lpm=row["valve_discharge_rate_lpm"],
                        recommendations=json.loads(row["recommendations"] or "[]"),
                        storage_backend=row["storage_backend"],
                        hourly_projection=[
                            HourlyWaterForecast(**h) for h in json.loads(row["hourly_projection"] or "[]")
                        ] if row["hourly_projection"] else None
                    )
                    results.append(rec)
        except Exception as e:
            print(f"[Warning] Failed reading SQLite history: {e}")

        return results

    def get_health(self) -> SystemHealth:
        """Returns honest system health and cloud integration status."""
        total_records = 0
        try:
            with sqlite3.connect(self.sqlite_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM calculations")
                total_records = cursor.fetchone()[0]
        except Exception:
            total_records = 0

        persistence_mode = "AWS DynamoDB (Production Cloud)" if self.is_dynamodb_active else "Local SQLite (Ready for AWS)"

        return SystemHealth(
            status="healthy",
            app_name="JalLoop AutoReserve API",
            version="1.0.0",
            aws_dynamodb_configured=self.is_dynamodb_active,
            aws_region=self.aws_region if self.is_dynamodb_active else None,
            dynamodb_table=self.dynamodb_table_name if self.is_dynamodb_active else None,
            persistence_mode=persistence_mode,
            total_records_stored=total_records
        )


storage = StorageManager()
