document.getElementById('calculate-button').addEventListener('click', function() {
    // Clear previous results
    document.getElementById('results').innerHTML = '';

    // Disable the button while fetching
    this.disabled = true;
    this.textContent = 'Calculating...';

    fetch('/calculate-prices')
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Server responded with an error!');
        }
    })
    .then(data => {
        let resultsHtml = `<div class="result-item"><span class="result-label">Divine price:</span> <span class="result-value">${data.divine_price} Chaos</span></div>` +
                          `<div class="result-item"><span class="result-label">Bulk price (Screaming):</span> <span class="result-value">${data.bulk_price_screaming} Divine</span></div>` +
                          `<div class="result-item"><span class="result-label">Bulk price (Incandescent):</span> <span class="result-value">${data.bulk_price_incandescent} Divine</span></div>` +
                          `<div class="result-item"><span class="result-label">Single price (Screaming):</span> <span class="result-value">${data.single_price_screaming} Chaos</span></div>` +
                          `<div class="result-item"><span class="result-label">Single price (Incandescent):</span> <span class="result-value">${data.single_price_incandescent} Chaos</span></div>` +
                          `<div class="result-item"><span class="result-label">Profit Screaming:</span> <span class="result-value">${data.profit_screaming} Chaos</span></div>` +
                          `<div class="result-item"><span class="result-label">Profit Incandescent:</span> <span class="result-value">${data.profit_incandescent} Chaos</span></div>`;
        document.getElementById('results').innerHTML = resultsHtml;
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = '<p class="error-message">Error loading results. Please try again.</p>';
    })
    .finally(() => {
        // Re-enable the button and reset its text regardless of the outcome
        document.getElementById('calculate-button').disabled = false;
        document.getElementById('calculate-button').textContent = 'Calculate Prices';
    });
});
