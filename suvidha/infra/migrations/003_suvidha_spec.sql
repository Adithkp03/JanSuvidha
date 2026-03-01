-- Phase 3: SUVIDHA Spec - Core mandatory + optional departments and services
-- Aligns with problem statement: Electricity, Gas, Water, Waste, Municipal Civic, Public Works, Emergency

-- Add SLA and fraud columns to requests (for admin features)
ALTER TABLE requests ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS fraud_flag BOOLEAN DEFAULT FALSE;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS kiosk_id UUID REFERENCES kiosks(id);

-- Ensure requests has department and service_type (from 001_core)
-- Fix: Add service_code if missing (some code paths use it); keep department/service_type as canonical
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='department') THEN
    ALTER TABLE requests ADD COLUMN department TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='service_type') THEN
    ALTER TABLE requests ADD COLUMN service_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='service_code') THEN
    ALTER TABLE requests ADD COLUMN service_code TEXT;
  END IF;
END $$;

-- Update departments: Replace Transport/Revenue with Waste, Public Works, Emergency
-- Keep Electricity, Gas, Water, MC; add Waste, Public Works, Emergency

-- Delete old services first (FK to departments)
DELETE FROM services WHERE department_id IN (
  SELECT id FROM departments WHERE code IN ('transport', 'revenue')
);

-- Delete Transport and Revenue departments
DELETE FROM departments WHERE code IN ('transport', 'revenue');

-- Update existing department descriptions
UPDATE departments SET name = 'Electricity Department', description = 'Billing, connection, outages, meter services', icon = 'Zap' WHERE code = 'electricity';
UPDATE departments SET name = 'Gas Distribution Department', description = 'Domestic gas services', icon = 'Flame' WHERE code = 'gas';
UPDATE departments SET name = 'Water Supply Department', description = 'Municipal water services', icon = 'Droplets' WHERE code = 'water';
UPDATE departments SET name = 'Municipal Civic Services', description = 'Certificates & local body services', icon = 'Building2' WHERE code = 'mc';

-- Insert new departments
INSERT INTO departments (id, name, code, icon, description) VALUES
  ('d0000000-0000-0000-0000-000000000007', 'Waste Management Department', 'waste', 'Recycle', 'Municipal sanitation and garbage collection')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon;

INSERT INTO departments (id, name, code, icon, description) VALUES
  ('d0000000-0000-0000-0000-000000000008', 'Public Works Department', 'public_works', 'Wrench', 'Roads, streetlights, drainage')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon;

INSERT INTO departments (id, name, code, icon, description) VALUES
  ('d0000000-0000-0000-0000-000000000009', 'Emergency & Public Safety', 'emergency', 'AlertTriangle', 'Hazard reports, disaster relief')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon;

-- Get department UUIDs for inserts
-- Electricity d002, Gas d001, Water d004, MC d003, Waste d007, Public Works d008, Emergency d009

-- Delete old services and re-insert per spec (clean slate for core depts)
DELETE FROM services WHERE department_id IN (SELECT id FROM departments WHERE code IN ('electricity','gas','water','mc','waste','public_works','emergency'));

-- ELECTRICITY DEPARTMENT
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000002', 'Electricity Bill Payment', 'elec_bill_pay', 'Pay electricity bill', '["consumer_number"]'::jsonb,
'[{"name":"consumer_number","label":"Consumer/Account ID","type":"text","required":true},{"name":"amount","label":"Amount (if known)","type":"number","required":false}]'::jsonb, 0, 1),
('d0000000-0000-0000-0000-000000000002', 'New Electricity Connection', 'elec_new_conn', 'Apply for new meter', '["id_proof","address_proof","property_ownership","building_approval"]'::jsonb,
'[{"name":"applicant_name","label":"Applicant Name","type":"text","required":true},{"name":"property_address","label":"Property Address","type":"text","required":true},{"name":"load_kw","label":"Required Load (kW)","type":"number","required":true}]'::jsonb, 1000, 10),
('d0000000-0000-0000-0000-000000000002', 'Load Increase / Decrease', 'elec_load_change', 'Change sanctioned load', '["id_proof","wiring_certificate"]'::jsonb,
'[{"name":"consumer_number","label":"Connection ID","type":"text","required":true},{"name":"new_load_kw","label":"New Load (kW)","type":"number","required":true}]'::jsonb, 500, 7),
('d0000000-0000-0000-0000-000000000002', 'Meter Complaint / Fault', 'elec_meter_fault', 'Meter not working or faulty', '[]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"issue_type","label":"Issue Type","type":"select","options":[{"value":"not_working","label":"Meter Not Working"},{"value":"wrong_reading","label":"Wrong Reading"},{"value":"damaged","label":"Damaged"}],"required":true},{"name":"description","label":"Description","type":"text","required":false}]'::jsonb, 0, 5),
('d0000000-0000-0000-0000-000000000002', 'Power Outage Complaint', 'elec_outage', 'Report power cut', '[]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"area","label":"Area/Location","type":"text","required":true},{"name":"urgency","label":"Urgency","type":"select","options":[{"value":"normal","label":"Normal"},{"value":"high","label":"High"}],"required":true}]'::jsonb, 0, 3),
('d0000000-0000-0000-0000-000000000002', 'Name Transfer / Ownership Change', 'elec_name_transfer', 'Transfer connection to new owner', '["id_proof","address_proof","sale_deed"]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"new_owner_name","label":"New Owner Name","type":"text","required":true}]'::jsonb, 200, 14),
('d0000000-0000-0000-0000-000000000002', 'Bill Correction Request', 'elec_bill_correction', 'Request bill correction', '["recent_bill"]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"issue_description","label":"Issue Description","type":"text","required":true}]'::jsonb, 0, 7);

-- GAS DISTRIBUTION
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000001', 'New Gas Connection', 'gas_new_conn', 'Apply for new LPG connection', '["id_proof","address_proof","photo","declaration_form"]'::jsonb,
'[{"name":"applicant_name","label":"Applicant Name","type":"text","required":true},{"name":"household_address","label":"Household Address","type":"text","required":true},{"name":"distributor","label":"Preferred Distributor","type":"text","required":true}]'::jsonb, 500, 15),
('d0000000-0000-0000-0000-000000000001', 'Gas Refill Booking', 'gas_refill', 'Book LPG cylinder refill', '[]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"payment_option","label":"Payment","type":"select","options":[{"value":"cash","label":"Cash on Delivery"},{"value":"prepaid","label":"Prepaid"}],"required":true}]'::jsonb, 0, 2),
('d0000000-0000-0000-0000-000000000001', 'Address Change', 'gas_addr_change', 'Update connection address', '["new_address_proof"]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"new_address","label":"New Address","type":"text","required":true}]'::jsonb, 100, 7),
('d0000000-0000-0000-0000-000000000001', 'Gas Leakage Complaint', 'gas_leakage', 'Report gas leak - emergency', '[]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"urgency","label":"Urgency","type":"select","options":[{"value":"emergency","label":"Emergency"},{"value":"normal","label":"Normal"}],"required":true},{"name":"location","label":"Location","type":"text","required":true}]'::jsonb, 0, 1),
('d0000000-0000-0000-0000-000000000001', 'Regulator / Cylinder Issue', 'gas_regulator_issue', 'Regulator or cylinder problem', '[]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"issue_type","label":"Issue Type","type":"select","options":[{"value":"regulator","label":"Regulator"},{"value":"cylinder","label":"Cylinder"}],"required":true}]'::jsonb, 0, 5),
('d0000000-0000-0000-0000-000000000001', 'Connection Transfer', 'gas_connection_transfer', 'Transfer connection to new address', '["id_proof","new_address_proof"]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"new_address","label":"New Address","type":"text","required":true}]'::jsonb, 150, 10),
('d0000000-0000-0000-0000-000000000001', 'Subsidy / KYC Update', 'gas_subsidy_kyc', 'Update subsidy or KYC details', '["id_proof","bank_passbook"]'::jsonb,
'[{"name":"consumer_number","label":"Consumer Number","type":"text","required":true},{"name":"update_type","label":"Update Type","type":"select","options":[{"value":"subsidy","label":"Subsidy"},{"value":"kyc","label":"KYC"}],"required":true}]'::jsonb, 0, 7);

-- WATER SUPPLY
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000004', 'Water Bill Payment', 'water_bill_pay', 'Pay water bill', '[]'::jsonb,
'[{"name":"connection_id","label":"Connection ID","type":"text","required":true}]'::jsonb, 0, 1),
('d0000000-0000-0000-0000-000000000004', 'New Water Connection', 'water_new_conn', 'Apply for domestic water connection', '["id_proof","address_proof","property_proof","building_approval"]'::jsonb,
'[{"name":"applicant_name","label":"Applicant Name","type":"text","required":true},{"name":"property_address","label":"Property Address","type":"text","required":true}]'::jsonb, 500, 14),
('d0000000-0000-0000-0000-000000000004', 'Low Pressure Complaint', 'water_low_pressure', 'Report low water pressure', '[]'::jsonb,
'[{"name":"connection_id","label":"Connection ID","type":"text","required":true},{"name":"area","label":"Area","type":"text","required":true}]'::jsonb, 0, 5),
('d0000000-0000-0000-0000-000000000004', 'Leakage Complaint', 'water_leakage', 'Report water leakage', '[]'::jsonb,
'[{"name":"connection_id","label":"Connection ID","type":"text","required":true},{"name":"location","label":"Location","type":"text","required":true}]'::jsonb, 0, 5),
('d0000000-0000-0000-0000-000000000004', 'Water Quality Complaint', 'water_quality', 'Report water quality issue', '[]'::jsonb,
'[{"name":"connection_id","label":"Connection ID","type":"text","required":true},{"name":"issue_description","label":"Issue Description","type":"text","required":true}]'::jsonb, 0, 7),
('d0000000-0000-0000-0000-000000000004', 'Meter Issue', 'water_meter_issue', 'Water meter fault', '[]'::jsonb,
'[{"name":"connection_id","label":"Connection ID","type":"text","required":true},{"name":"issue_type","label":"Issue Type","type":"text","required":true}]'::jsonb, 0, 5),
('d0000000-0000-0000-0000-000000000004', 'Connection Transfer', 'water_connection_transfer', 'Transfer connection', '["id_proof","new_address_proof"]'::jsonb,
'[{"name":"connection_id","label":"Connection ID","type":"text","required":true},{"name":"new_address","label":"New Address","type":"text","required":true}]'::jsonb, 200, 10);

-- WASTE MANAGEMENT
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000007', 'Garbage Not Collected Complaint', 'waste_garbage_not_collected', 'Report missed garbage collection', '[]'::jsonb,
'[{"name":"address","label":"Address","type":"text","required":true},{"name":"location_type","label":"Location Type","type":"select","options":[{"value":"residential","label":"Residential"},{"value":"commercial","label":"Commercial"}],"required":true}]'::jsonb, 0, 3),
('d0000000-0000-0000-0000-000000000007', 'Bulk Waste Pickup Request', 'waste_bulk_pickup', 'Schedule bulk waste pickup', '[]'::jsonb,
'[{"name":"address","label":"Address","type":"text","required":true},{"name":"waste_type","label":"Waste Type","type":"text","required":true},{"name":"preferred_date","label":"Preferred Date","type":"date","required":true}]'::jsonb, 0, 5),
('d0000000-0000-0000-0000-000000000007', 'Street Cleaning Complaint', 'waste_street_cleaning', 'Report dirty street', '[]'::jsonb,
'[{"name":"location","label":"Location","type":"text","required":true},{"name":"description","label":"Description","type":"text","required":true}]'::jsonb, 0, 5),
('d0000000-0000-0000-0000-000000000007', 'Dumping Complaint', 'waste_dumping', 'Report illegal dumping', '[]'::jsonb,
'[{"name":"location","label":"Location","type":"text","required":true},{"name":"description","label":"Description","type":"text","required":false}]'::jsonb, 0, 5),
('d0000000-0000-0000-0000-000000000007', 'Dead Animal Removal', 'waste_dead_animal', 'Request dead animal removal', '[]'::jsonb,
'[{"name":"location","label":"Location","type":"text","required":true},{"name":"animal_type","label":"Animal Type","type":"text","required":false}]'::jsonb, 0, 2),
('d0000000-0000-0000-0000-000000000007', 'Public Toilet Maintenance Complaint', 'waste_toilet_maintenance', 'Report public toilet issue', '[]'::jsonb,
'[{"name":"location","label":"Toilet Location","type":"text","required":true},{"name":"issue_type","label":"Issue Type","type":"text","required":true}]'::jsonb, 0, 5);

-- MUNICIPAL CIVIC SERVICES (expand)
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000003', 'Birth Certificate', 'mc_birth_cert', 'Apply for birth certificate', '["hospital_proof","parent_id","address_proof"]'::jsonb,
'[{"name":"child_name","label":"Child Name","type":"text","required":true},{"name":"dob","label":"Date of Birth","type":"date","required":true},{"name":"gender","label":"Gender","type":"select","options":[{"value":"Male","label":"Male"},{"value":"Female","label":"Female"},{"value":"Other","label":"Other"}],"required":true},{"name":"place_of_birth","label":"Place of Birth","type":"text","required":true}]'::jsonb, 50, 7),
('d0000000-0000-0000-0000-000000000003', 'Death Certificate', 'mc_death_cert', 'Apply for death certificate', '["death_report","id_proof","address_proof"]'::jsonb,
'[{"name":"deceased_name","label":"Deceased Name","type":"text","required":true},{"name":"dod","label":"Date of Death","type":"date","required":true},{"name":"place_of_death","label":"Place of Death","type":"text","required":true}]'::jsonb, 50, 7),
('d0000000-0000-0000-0000-000000000003', 'Marriage Certificate', 'mc_marriage_cert', 'Apply for marriage certificate', '["bride_id","groom_id","marriage_proof","witness_id"]'::jsonb,
'[{"name":"bride_name","label":"Bride Name","type":"text","required":true},{"name":"groom_name","label":"Groom Name","type":"text","required":true},{"name":"marriage_date","label":"Marriage Date","type":"date","required":true}]'::jsonb, 100, 14),
('d0000000-0000-0000-0000-000000000003', 'Property Tax Payment', 'mc_prop_tax', 'Pay property tax', '[]'::jsonb,
'[{"name":"property_id","label":"Property ID","type":"text","required":true},{"name":"financial_year","label":"Financial Year","type":"text","required":true}]'::jsonb, 0, 1),
('d0000000-0000-0000-0000-000000000003', 'Trade License Application', 'mc_trade_license', 'Apply for trade license', '["business_proof","id_proof","address_proof","noc"]'::jsonb,
'[{"name":"business_name","label":"Business Name","type":"text","required":true},{"name":"business_address","label":"Business Address","type":"text","required":true},{"name":"business_type","label":"Business Type","type":"text","required":true}]'::jsonb, 500, 21),
('d0000000-0000-0000-0000-000000000003', 'Pension Application', 'mc_pension', 'Apply for pension', '["age_proof","id_proof","bank_passbook","income_proof"]'::jsonb,
'[{"name":"applicant_name","label":"Applicant Name","type":"text","required":true},{"name":"dob","label":"Date of Birth","type":"date","required":true},{"name":"pension_type","label":"Pension Type","type":"select","options":[{"value":"old_age","label":"Old Age"},{"value":"widow","label":"Widow"},{"value":"disability","label":"Disability"}],"required":true}]'::jsonb, 0, 30),
('d0000000-0000-0000-0000-000000000003', 'Caste / Income / Residence Certificate', 'mc_caste_income_residence', 'Apply for caste, income or residence certificate', '["id_proof","address_proof","affidavit","supporting_proof"]'::jsonb,
'[{"name":"applicant_name","label":"Applicant Name","type":"text","required":true},{"name":"certificate_type","label":"Certificate Type","type":"select","options":[{"value":"caste","label":"Caste"},{"value":"income","label":"Income"},{"value":"residence","label":"Residence"}],"required":true},{"name":"purpose","label":"Purpose","type":"text","required":true}]'::jsonb, 30, 10);

-- PUBLIC WORKS (optional)
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000008', 'Road Damage Complaint', 'pw_road_damage', 'Report road damage', '[]'::jsonb,
'[{"name":"location","label":"Location","type":"text","required":true},{"name":"damage_type","label":"Damage Type","type":"text","required":true}]'::jsonb, 0, 7),
('d0000000-0000-0000-0000-000000000008', 'Streetlight Not Working', 'pw_streetlight', 'Report faulty streetlight', '[]'::jsonb,
'[{"name":"location","label":"Location/Pole Number","type":"text","required":true},{"name":"description","label":"Description","type":"text","required":false}]'::jsonb, 0, 5),
('d0000000-0000-0000-0000-000000000008', 'Drainage Blockage', 'pw_drainage', 'Report blocked drainage', '[]'::jsonb,
'[{"name":"location","label":"Location","type":"text","required":true},{"name":"severity","label":"Severity","type":"select","options":[{"value":"low","label":"Low"},{"value":"high","label":"High"}],"required":true}]'::jsonb, 0, 5);

-- EMERGENCY (optional)
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000009', 'Hazard Report', 'emergency_hazard', 'Report safety hazard', '[]'::jsonb,
'[{"name":"location","label":"Location","type":"text","required":true},{"name":"hazard_type","label":"Hazard Type","type":"text","required":true},{"name":"urgency","label":"Urgency","type":"select","options":[{"value":"high","label":"High"},{"value":"critical","label":"Critical"}],"required":true}]'::jsonb, 0, 1),
('d0000000-0000-0000-0000-000000000009', 'Disaster Relief Request', 'emergency_disaster_relief', 'Request disaster relief', '[]'::jsonb,
'[{"name":"applicant_name","label":"Applicant Name","type":"text","required":true},{"name":"disaster_type","label":"Disaster Type","type":"text","required":true},{"name":"description","label":"Description","type":"text","required":true}]'::jsonb, 0, 3),
('d0000000-0000-0000-0000-000000000009', 'Emergency Alert Info', 'emergency_alert_info', 'Get emergency contact info', '[]'::jsonb,
'[{"name":"info_type","label":"Info Type","type":"select","options":[{"value":"contacts","label":"Emergency Contacts"},{"value":"shelters","label":"Shelters"},{"value":"helplines","label":"Helplines"}],"required":true}]'::jsonb, 0, 0);
