# Purpose: Intent (ML) inference API - maps citizen text to department + service.
from fastapi import FastAPI
from pydantic import BaseModel
import json
import os

try:
    from google import genai
except Exception:  # pragma: no cover - optional dependency in dev
    genai = None


app = FastAPI(title="JanSuvidha Intent Service", version="1.0.0")

# Keywords -> (department, service_type)
INTENT_MAP = [
    # Electricity
    (["electricity bill", "pay bill", "electric bill payment"], "electricity", "elec_bill_pay"),
    (["new connection", "new meter", "electric connection"], "electricity", "elec_new_conn"),
    (["load increase", "load decrease", "load change"], "electricity", "elec_load_change"),
    (["meter fault", "meter not working", "wrong meter"], "electricity", "elec_meter_fault"),
    (["power cut", "power outage", "no electricity", "outage"], "electricity", "elec_outage"),
    (["name transfer", "ownership change"], "electricity", "elec_name_transfer"),
    (["bill correction", "wrong bill"], "electricity", "elec_bill_correction"),
    # Gas
    (["gas connection", "new gas", "lpg connection"], "gas", "gas_new_conn"),
    (["gas refill", "cylinder refill", "book cylinder"], "gas", "gas_refill"),
    (["gas address change"], "gas", "gas_addr_change"),
    (["gas leak", "gas leakage"], "gas", "gas_leakage"),
    (["regulator", "cylinder issue"], "gas", "gas_regulator_issue"),
    (["gas transfer", "connection transfer"], "gas", "gas_connection_transfer"),
    (["subsidy", "kyc update"], "gas", "gas_subsidy_kyc"),
    # Water
    (["water bill", "pay water"], "water", "water_bill_pay"),
    (["water connection", "new water", "tap connection"], "water", "water_new_conn"),
    (["low pressure", "water pressure"], "water", "water_low_pressure"),
    (["water leak", "water leakage", "tap leak"], "water", "water_leakage"),
    (["water quality", "dirty water"], "water", "water_quality"),
    (["water meter"], "water", "water_meter_issue"),
    (["water transfer"], "water", "water_connection_transfer"),
    # Waste
    (["garbage", "garbage not collected", "waste not collected"], "waste", "waste_garbage_not_collected"),
    (["bulk waste", "bulk pickup"], "waste", "waste_bulk_pickup"),
    (["street cleaning", "dirty street"], "waste", "waste_street_cleaning"),
    (["dumping", "illegal dumping"], "waste", "waste_dumping"),
    (["dead animal"], "waste", "waste_dead_animal"),
    (["public toilet", "toilet maintenance"], "waste", "waste_toilet_maintenance"),
    # Municipal
    (["birth certificate"], "mc", "mc_birth_cert"),
    (["death certificate"], "mc", "mc_death_cert"),
    (["marriage certificate"], "mc", "mc_marriage_cert"),
    (["property tax", "house tax"], "mc", "mc_prop_tax"),
    (["trade license", "business license"], "mc", "mc_trade_license"),
    (["pension"], "mc", "mc_pension"),
    (["caste certificate", "income certificate", "residence certificate"], "mc", "mc_caste_income_residence"),
    # Public Works
    (["road damage", "pothole", "bad road"], "public_works", "pw_road_damage"),
    (["streetlight", "street light", "light not working"], "public_works", "pw_streetlight"),
    (["drainage", "drainage blockage", "blocked drain"], "public_works", "pw_drainage"),
    # Emergency
    (["hazard", "safety hazard"], "emergency", "emergency_hazard"),
    (["disaster", "disaster relief"], "emergency", "emergency_disaster_relief"),
    (["emergency", "emergency contact", "helpline"], "emergency", "emergency_alert_info"),
]

SERVICE_CODES = {svc for _, _, svc in INTENT_MAP}
DEPARTMENT_CODES = {dept for _, dept, _ in INTENT_MAP}
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def normalize_result(department, service_type, confidence):
    if department not in DEPARTMENT_CODES or service_type not in SERVICE_CODES:
        return None
    return {
        "intent": f"{department}_{service_type}",
        "confidence": float(confidence),
        "suggested_fields": {
            "department": department,
            "service_type": service_type,
        },
    }


def try_gemini(text):
    if not GEMINI_API_KEY or not genai:
        return None
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = (
            "You are an intent router for a civic kiosk. "
            "Return only JSON with keys: department, service_type, confidence (0-1). "
            f"Allowed departments: {sorted(DEPARTMENT_CODES)}. "
            f"Allowed service_type values: {sorted(SERVICE_CODES)}. "
            f"User text: {text}"
        )
        resp = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
        )
        raw = (resp.text or "").strip()
        # Best-effort JSON parse
        data = json.loads(raw)
        return normalize_result(
            data.get("department"),
            data.get("service_type"),
            data.get("confidence", 0.7),
        )
    except Exception:
        return None


class PredictRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"ok": True, "service": "intent-service"}


@app.post("/predict")
def predict(req: PredictRequest):
    text = req.text.lower().strip()

    gemini_result = try_gemini(text)
    if gemini_result:
        return gemini_result

    for keywords, department, service_type in INTENT_MAP:
        if any(kw in text for kw in keywords):
            return normalize_result(department, service_type, 0.85)

    # Fallback: try to match department only
    if "electric" in text or "power" in text:
        return normalize_result("electricity", "elec_outage", 0.6)
    if "water" in text or "tap" in text:
        return normalize_result("water", "water_leakage", 0.6)
    if "gas" in text:
        return normalize_result("gas", "gas_refill", 0.6)
    if "garbage" in text or "waste" in text:
        return normalize_result("waste", "waste_garbage_not_collected", 0.6)
    if "birth" in text or "certificate" in text or "property tax" in text:
        return normalize_result("mc", "mc_birth_cert", 0.6)

    return normalize_result("mc", "mc_birth_cert", 0.3)
