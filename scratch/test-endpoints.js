async function check() {
    try {
        // 1. Try to POST a new product
        const payload = {
            title: "Test Tee",
            category: "t-shirt",
            price: 699,
            originalPrice: 999,
            image: "",
            description: "Test description",
            sizes: ["M", "L"],
            tags: ["test"],
            stock: 50,
            inStock: true
        };

        console.log('Sending POST payload:', payload);

        const postRes = await fetch('https://netravefashion.onrender.com/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('POST Status:', postRes.status);
        const newProduct = await postRes.json();
        console.log('POST Response:', newProduct);

        if (postRes.ok && newProduct.id) {
            // 2. Try to update it
            const updatePayload = {
                ...payload,
                stock: 75 // Update stock
            };
            const putRes = await fetch(`https://netravefashion.onrender.com/api/products/${newProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });
            console.log('PUT Status:', putRes.status);
            const updated = await putRes.json();
            console.log('PUT Response:', updated);
        }
    } catch (err) {
        console.error('Failed to run test:', err.message);
    }
}
check();
