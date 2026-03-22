import fs from 'fs';

const seedPath = 'd:/JanSuvidha/suvidha/portal/seed/admin-seed.json';
const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// Expand Metrics additively
data.metrics.by_department = { electricity: 87, gas: 34, water: 56, civil: 43, waste: 19, power: 8 };

const newRequests = [];
const depts = ['power', 'water', 'civil', 'revenue', 'gas', 'waste', 'public_works'];
const statuses = ['pending', 'in_review', 'doc_required', 'approved', 'rejected'];
const firstNames = ['Amit', 'Geeta', 'Ravi', 'Pooja', 'Sunil', 'Kiran', 'Deepak', 'Neha', 'Vijay', 'Anita'];
const lastNames = ['Singh', 'Patel', 'Sharma', 'Reddy', 'Kumar', 'Verma', 'Gupta', 'Yadav', 'Rao', 'Nair'];

for (let i = 0; i < 30; i++) {
    const id = `REQ-2026-90${i.toString().padStart(2, '0')}`;
    const dept = depts[Math.floor(Math.random() * depts.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    
    newRequests.push({
        id,
        department: dept,
        service_name: `Service for ${dept}`,
        applicant_name: name,
        phone: `999${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: status,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
        intent_confidence: parseFloat((0.5 + Math.random() * 0.5).toFixed(2)),
        urgency_flag: Math.random() > 0.8
    });
}

data.requests.push(...newRequests);

fs.writeFileSync(seedPath, JSON.stringify(data, null, 4));
console.log('Successfully expanded admin-seed.json');
