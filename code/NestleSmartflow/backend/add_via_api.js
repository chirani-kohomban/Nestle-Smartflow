const API_BASE = 'https://nestle-smartflow--chiranivihanxa.replit.app/api';

async function addDataViaApi() {
    try {
        console.log("Logging into Live API as admin...");
        // 1. Authenticate to get token
        const loginRes = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password123' })
        });
        
        if (!loginRes.ok) throw new Error("Admin login failed");
        const { token } = await loginRes.json();
        const authHeader = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        // 2. Add Distributors
        console.log("Registering new distributors...");
        const newDistributors = [
            { username: 'distributor_kandy', password: 'password123', role: 'DISTRIBUTOR' },
            { username: 'distributor_galle', password: 'password123', role: 'DISTRIBUTOR' },
            { username: 'distributor_colombo_south', password: 'password123', role: 'DISTRIBUTOR' }
        ];

        for (const u of newDistributors) {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(u)
            });
            if (res.ok) console.log(`Added distributor: ${u.username}`);
            else if (res.status === 409) console.log(`${u.username} already exists.`);
            else console.log(`Failed to add ${u.username}`);
        }

        // 3. Add Products
        console.log("Registering new products...");
        const newProducts = [
            { name: 'Milo UHT 180ml', sku: 'MIL-UHT-180', unit: 'Pack', initialQuantity: 1000 },
            { name: 'Maggi Coconut Milk Powder 300g', sku: 'MAG-CMP-300', unit: 'Pouch', initialQuantity: 1000 },
            { name: 'Nescafé Classic 50g', sku: 'NES-CLS-50', unit: 'Jar', initialQuantity: 1000 },
            { name: 'Nestomalt 400g', sku: 'NST-MLT-400', unit: 'Box', initialQuantity: 1000 },
            { name: 'Cerelac Wheat 400g', sku: 'CER-WT-400', unit: 'Tin', initialQuantity: 1000 }
        ];

        for (const p of newProducts) {
             const res = await fetch(`${API_BASE}/products`, {
                 method: 'POST',
                 headers: authHeader,
                 body: JSON.stringify(p)
             });
             if (res.ok) console.log(`Added product: ${p.name}`);
             else console.log(`Failed to add product: ${p.name}`);
        }

        console.log("✅ Successfully injected more presentation data via API!");
        
    } catch (err) {
        console.error("Error:", err);
    }
}

addDataViaApi();
