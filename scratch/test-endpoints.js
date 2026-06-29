async function check() {
    try {
        const payload = {
            whatsappNumber: "919946550713",
            maintenanceMode: true,
            maintenanceMessage: "We are undergoing scheduled maintenance. We will be back shortly!",
            maintenanceExpiry: Date.now() + 3600000,
            offerNotification: ""
        };
        console.log('Posting settings to Render...');
        const response = await fetch('https://netravefashion.onrender.com/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('Response Status:', response.status);
        const data = await response.json();
        console.log('Response Body:', data);
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}
check();
