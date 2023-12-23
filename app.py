from flask import Flask, jsonify, render_template
import requests
import time

app = Flask(__name__)

def create_payload(status, have, want, minimum):
    return {
        "query": {
            "status": {"option": status},
            "have": have,
            "want": want,
            "minimum": minimum
        },
        "sort": {"have": "asc"},
        "engine": "new"
    }

def make_request(url, headers, payload):
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        print('Request was successful.')
        return response.json()
    else:
        print('Request failed.')
        print('Status code:', response.status_code)
        print('Response body:', response.text)
        return None

def calculate_price(response_data, count_limit):
    if response_data is None:
        return 0
    result_count = 0
    for id, data in response_data.get('result', {}).items():
        if data.get('listing') and data['listing'].get('offers'):
            exchange_amount = data['listing']['offers'][0]['exchange']['amount']
            item_amount = data['listing']['offers'][0]['item']['amount']
            result_count += 1
            if result_count == count_limit:
                return exchange_amount / item_amount
    return 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate-prices', methods=['GET'])
def calculate_prices():
    # Your Python code logic
    url = 'https://www.pathofexile.com/api/trade/exchange/Affliction'
    headers = {
        'Content-Type': 'application/json',
        # Use your own cookie
        'Cookie': '_ga=GA1.1.1968711660.1690669745; cf_clearance=m_.2s6jF2SpLwZB5Xj1cMja39SWJ.WDJFZ34qGYPWuM-1701935148-0-1-2e83d57a.6b5d4fe.79828a9a-160.0.0; POESESSID=41f665ba840abe11284c72e3cc5481c8; _ga_R6TM1WQ9DW=GS1.1.1703154847.353.0.1703154847.0.0.0',
        'User-Agent': 'your_user_agent_here'
    }

    currency_payload = create_payload("online", ["chaos"], ["divine"], 1)
    bulk_payload_screaming = create_payload("online", ["divine"], ["screaming-invitation"], 10)
    bulk_payload_incandescent = create_payload("online", ["divine"], ["incandescent-invitation"], 10)
    single_payload_screaming = create_payload("online", ["chaos"], ["screaming-invitation"], 1)
    single_payload_incandescent = create_payload("online", ["chaos"], ["incandescent-invitation"], 1)

    # Make requests with a delay for 1 second
    # Delay is made to prevent rate limit from Path of Exile trade site
    currency_response_data = make_request(url, headers, currency_payload)
    time.sleep(1)
    bulk_response_data_screaming = make_request(url, headers, bulk_payload_screaming)
    time.sleep(1)
    bulk_response_data_incandescent = make_request(url, headers, bulk_payload_incandescent)
    time.sleep(1)
    single_response_data_screaming = make_request(url, headers, single_payload_screaming)
    time.sleep(1)
    single_response_data_incandescent = make_request(url, headers, single_payload_incandescent)

    # Calculate prices
    # Currency prices count_limit should always be set to more than 15, this is to prevent price fixers
    # Single prices count_limit should always be set to more than 5, this is to prevent price fixers
    # Bulk prices count_limit should always be set to 1 or 2, bulk prices usually don't have price fixers
    divine_price = calculate_price(currency_response_data, 21)
    bulk_price_screaming = calculate_price(bulk_response_data_screaming, 1)
    bulk_price_incandescent = calculate_price(bulk_response_data_incandescent, 1)
    single_price_screaming = calculate_price(single_response_data_screaming, 7)
    single_price_incandescent = calculate_price(single_response_data_incandescent, 7)

    # Profit calculations
    profit_screaming = (divine_price * bulk_price_screaming) - single_price_screaming
    profit_incandescent = (divine_price * bulk_price_incandescent) - single_price_incandescent

    # Calculate and format the results
    results = {
        "divine_price": divine_price,
        "bulk_price_screaming": bulk_price_screaming,
        "bulk_price_incandescent": bulk_price_incandescent,
        "single_price_screaming": single_price_screaming,
        "single_price_incandescent": single_price_incandescent,
        "profit_screaming": profit_screaming,
        "profit_incandescent": profit_incandescent
    }

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
