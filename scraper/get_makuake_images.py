import urllib.request, json

with open('../data/latest/crowdfunding.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

items = data['items']

makuake_items = [item for item in items if item['platform'] == 'Makuake' and not item.get('image')]
print(f'Found {len(makuake_items)} Makuake items without images')

# Based on the working examples:
# keychronk3-he-ultra -> 51986
# dnsys-boostsuit -> 52042
# These were from around the same time period
# Let's try to find valid project IDs by checking image URLs in a range

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}

def check_image(url):
    try:
        req = urllib.request.Request(url, method='HEAD', headers=headers)
        resp = urllib.request.urlopen(req, timeout=5)
        return resp.status == 200
    except:
        return False

# Let's try to scan a range of project IDs
# Based on 51986 and 52042, let's search nearby IDs
print('Scanning for valid project IDs...')
valid_ids = []
for pid in range(51980, 52080):
    url = f"https://static.makuake.com/upload/project/{pid}/main_{pid}.png"
    if check_image(url):
        valid_ids.append(pid)
        print(f"  Found valid ID: {pid}")

print(f'\nTotal valid IDs found: {len(valid_ids)}')
print(f'IDs: {valid_ids}')

# Now let's match items to IDs based on project names
# We'll need to fetch the project page for each valid ID to get the slug
print('\nFetching project details...')
slug_to_id = {}
for pid in valid_ids:
    try:
        # We can infer the URL from the project page
        # But since we don't have slugs, let's just save the image URLs
        pass
    except:
        pass

# For now, let's use a different approach
# Assign found images to items based on keyword matching
images_found = [f"https://static.makuake.com/upload/project/{pid}/main_{pid}.png" for pid in valid_ids]
print(f'\nAvailable images: {len(images_found)}')

# Match items to images based on keywords in the name
for item in makuake_items:
    name_lower = item['name'].lower()
    matched = False
    
    # Check for keyword matches with known items
    if 'battery' in name_lower or 'バッテリー' in name_lower:
        # Could be tough-battery or cool-battery
        pass
    if 'keychron' in name_lower or 'keyboard' in name_lower or 'キーボード' in name_lower:
        item['image'] = "https://static.makuake.com/upload/project/51986/main_51986.png"
        matched = True
    if 'boostsuit' in name_lower or 'dnsys' in name_lower:
        item['image'] = "https://static.makuake.com/upload/project/52042/main_52042.png"
        matched = True
    
    if matched:
        print(f"Matched: {item['name'][:50]} -> {item['image']}")

with open('../data/latest/crowdfunding.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('\nDone!')

no_image = [item for item in makuake_items if not item.get('image')]
print(f'Items still without images: {len(no_image)}')