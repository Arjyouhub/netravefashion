async function check() {
    const urls = [
        'https://netravefashion.onrender.com/api/developer/login',
        'https://netravefashion.onrender.com/api/settings'
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url, {
                method: url.includes('login') ? 'POST' : 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: url.includes('login') ? JSON.stringify({ username: 'test', password: 'test' }) : undefined
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
