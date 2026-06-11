import urllib.request, json, re, time

with open('../data/latest/crowdfunding.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

items = data['items']

makuake_items = [item for item in items if item['platform'] == 'Makuake' and not item.get('image')]
print(f'Found {len(makuake_items)} Makuake items without images')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
}

# Try a broader search - look for all project IDs in a range
# and check which ones are valid by checking the image URL
import urllib.request

def check_image_exists(url):
    """Check if an image URL exists"""
    try:
        req = urllib.request.Request(url, method='HEAD', headers=headers)
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.status == 200
    except:
        return False

# For each item, try to construct possible project IDs
# Makuake project IDs seem to be around 51986 range recently
# Let's search by using the discover page with a different approach

print('\nTrying Makuake discover API...')
api_urls = [
    'https://www.makuake.com/api/discover/projects?tag_id=8&page=1&per_page=50',
    'https://www.makuake.com/discover/api/projects?tag_id=8',
    'https://www.makuake.com/api/v1/discover?tag_id=8',
]

for api_url in api_urls:
    print(f'  Trying: {api_url}')
    try:
        req = urllib.request.Request(api_url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=10)
        api_data = json.loads(resp.read().decode('utf-8'))
        print(f'  Success! Got data: {str(api_data)[:500]}')
        break
    except Exception as e:
        print(f'    Failed: {e}')

# The API approach might not work. Let's try to use the project name
# to construct search URLs and find the correct project ID
print('\nTrying search approach...')
for item in makuake_items:
    name = item['name']
    # Makuake search API
    search_term = name[:30]  # Use first 30 chars
    search_url = f'https://www.makuake.com/discover/projects/search/?keyword={urllib.parse.quote(search_term)}'
    print(f'  Searching: {search_term[:40]}')
    try:
        req = urllib.request.Request(search_url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=10)
        search_html = resp.read().decode('utf-8')
        
        # Look for project ID in results
        id_match = re.search(r'upload/project/(\d+)/main_\d+', search_html)
        if id_match:
            project_id = id_match.group(1)
            image_url = f"https://static.makuake.com/upload/project/{project_id}/main_{project_id}.png"
            item['image'] = image_url
            print(f'    Found! ID={project_id}, image={image_url}')
        else:
            print(f'    No image found in search results')
    except Exception as e:
        print(f'    Error: {e}')
    
    time.sleep(1)

with open('../data/latest/crowdfunding.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('\nDone!')

no_image = [item for item in makuake_items if not item.get('image')]
print(f'Items still without images: {len(no_image)}')