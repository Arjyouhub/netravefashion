async function check() {
    const urls = [
        'https://netravefashion.onrender.com/api/developer/system-status'
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-developer-session': 'test_token'
                }
            });
            console.log(url, '=> Status:', res.status);
            const text = await res.text();
            console.log('Response:', text.substring(0, 100));
        } catch (err) {
            console.error('Failed to fetch', url, err.message);
        }
    }
}
check();
