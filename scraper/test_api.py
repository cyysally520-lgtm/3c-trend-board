import urllib.request, json

# Try multiple API endpoints
urls = [
    'https://www.makuake.com/api/v1/discover/projects?tag_id=8&page=1&per_page=20',
    'https://www.makuake.com/api/discover/projects?tag_id=8&page=1&per_page=20',
    'https://www.makuake.com/api/v1/projects?tag_id=8&page=1&per_page=20',
    'https://www.makuake.com/discover/api/projects?tag_id=8&page=1&per_page=20',
]
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'Referer': 'https://www.makuake.com/discover/tags/8',
    'X-Requested-With': 'XMLHttpRequest',
}

for api_url in urls:
    print(f'\nTrying: {api_url}')
    req = urllib.request.Request(api_url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read().decode('utf-8'))
        print('SUCCESS!')
        print(json.dumps(data, ensure_ascii=False, indent=2)[:3000])
        break
    except Exception as e:
        print('Failed:', e)