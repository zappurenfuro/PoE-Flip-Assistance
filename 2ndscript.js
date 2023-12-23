async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createPayload(status, have, want, minimum) {
    return {
        query: {
            status: { option: status },
            have: have,
            want: want,
            minimum: minimum
        },
        sort: { have: "asc" },
        engine: "new"
    };
}

async function makeRequestWithDelay(url, payload, delay) {
    await sleep(delay);
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Use your own cookie
            'Cookie': '_ga=GA1.1.1968711660.1690669745; cf_clearance=m_.2s6jF2SpLwZB5Xj1cMja39SWJ.WDJFZ34qGYPWuM-1701935148-0-1-2e83d57a.6b5d4fe.79828a9a-160.0.0; POESESSID=41f665ba840abe11284c72e3cc5481c8; _ga_R6TM1WQ9DW=GS1.1.1703154847.353.0.1703154847.0.0.0',
            'User-Agent': 'your_user_agent_here'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Server responded with an error!');
        }
    });
}

function calculatePrice(responseData, countLimit) {
    let resultCount = 0;
    for (let id in responseData.result) {
        let data = responseData.result[id];
        if (data.listing && data.listing.offers) {
            let exchangeAmount = data.listing.offers[0].exchange.amount;
            let itemAmount = data.listing.offers[0].item.amount;
            resultCount++;
            if (resultCount === countLimit) {
                return exchangeAmount / itemAmount;
            }
        }
    }
    return 0;
}

async function fetchAllData() {
    const url = 'https://www.pathofexile.com/api/trade/exchange/Affliction';

    // Define your payloads
    const currencyPayload = createPayload("online", ["chaos"], ["divine"], 1);
    const bulkPayloadScreaming = createPayload("online", ["divine"], ["screaming-invitation"], 10);
    const bulkPayloadIncandescent = createPayload("online", ["divine"], ["incandescent-invitation"], 10);
    const singlePayloadScreaming = createPayload("online", ["chaos"], ["screaming-invitation"], 1);
    const singlePayloadIncandescent = createPayload("online", ["chaos"], ["incandescent-invitation"], 1);

    // Sequentially make requests with a delay
    const currencyResponseData = await makeRequestWithDelay(url, currencyPayload, 1000);
    const divinePrice = calculatePrice(currencyResponseData, 21);

    const bulkResponseDataScreaming = await makeRequestWithDelay(url, bulkPayloadScreaming, 1000);
    const bulkPriceScreaming = calculatePrice(bulkResponseDataScreaming, 1);

    const bulkResponseDataIncandescent = await makeRequestWithDelay(url, bulkPayloadIncandescent, 1000);
    const bulkPriceIncandescent = calculatePrice(bulkResponseDataIncandescent, 1);

    const singleResponseDataScreaming = await makeRequestWithDelay(url, singlePayloadScreaming, 1000);
    const singlePriceScreaming = calculatePrice(singleResponseDataScreaming, 7);

    const singleResponseDataIncandescent = await makeRequestWithDelay(url, singlePayloadIncandescent, 1000);
    const singlePriceIncandescent = calculatePrice(singleResponseDataIncandescent, 7);

    // Calculate profits
    const profitScreaming = (divinePrice * bulkPriceScreaming) - singlePriceScreaming;
    const profitIncandescent = (divinePrice * bulkPriceIncandescent) - singlePriceIncandescent;

    // Compile all the results into one object
    return {
        divinePrice,
        bulkPriceScreaming,
        bulkPriceIncandescent,
        singlePriceScreaming,
        singlePriceIncandescent,
        profitScreaming,
        profitIncandescent
    };
}

document.getElementById('calculate-button').addEventListener('click', async function() {
    this.disabled = true;
    this.textContent = 'Calculating...';
    document.getElementById('results').innerHTML = '';

    try {
        const results = await fetchAllData();

        // Format and display the results
        let resultsHtml = `
            <div class="result-item"><span class="result-label">Divine price:</span> <span class="result-value">${results.divinePrice} Chaos</span></div>
            <div class="result-item"><span class="result-label">Bulk price (Screaming):</span> <span class="result-value">${results.bulkPriceScreaming} Divine</span></div>
            <div class="result-item"><span class="result-label">Bulk price (Incandescent):</span> <span class="result-value">${results.bulkPriceIncandescent} Divine</span></div>
            <div class="result-item"><span class="result-label">Single price (Screaming):</span> <span class="result-value">${results.singlePriceScreaming} Chaos</span></div>
            <div class="result-item"><span class="result-label">Single price (Incandescent):</span> <span class="result-value">${results.singlePriceIncandescent} Chaos</span></div>
            <div class="result-item"><span class="result-label">Profit Screaming:</span> <span class="result-value">${results.profitScreaming} Chaos</span></div>
            <div class="result-item"><span class="result-label">Profit Incandescent:</span> <span class="result-value">${results.profitIncandescent} Chaos</span></div>
        `;
        
        document.getElementById('results').innerHTML = resultsHtml;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = '<p class="error-message">Error loading results. Please try again.</p>';
    } finally {
        // Re-enable the button
        this.disabled = false;
        this.textContent = 'Calculate Prices';
    }
});
