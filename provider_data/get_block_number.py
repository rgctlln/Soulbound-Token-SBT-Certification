# This is a temp file which is capable of connecting to http provider
# and printing current block number (so it's just a test script)

import requests
import json

with open('provider.json', 'r') as f:
    data = json.load(f)

url = data['http_provider']

payload = json.dumps({
    "method": "eth_blockNumber",
    "params": [],
    "id": 1,
    "jsonrpc": "2.0"
})

headers = {
    'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)

hex_block = response.json()["result"]
dec_block = int(hex_block, 16)

print(f"Block(hex): {hex_block}")
print(f"Block(dec): {dec_block}")
