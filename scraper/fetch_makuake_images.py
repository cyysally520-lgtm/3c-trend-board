import urllib.request, json, re, os

def fetch_makuake_data():
    url = 'https://www.makuake.com/discover/tags/8'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
    }
    req = urllib.request.Request(url, headers=headers)
    resp = urllib.request.urlopen(req, timeout=30)
    html = resp.read().decode('utf-8')
    
    print(f'HTML length: {len(html)}')
    
    # Look for JSON data in script tags
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
    
    for script in scripts:
        try:
            # Look for JSON objects that might contain project data
            if '"project"' in script or '"projects"' in script or '"name"' in script:
                # Try to find JSON arrays
                json_matches = re.findall(r'({[\s\S]*?"name"[\s\S]*?})', script)
                if json_matches:
                    print(f'Found potential JSON in script, length: {len(script)}')
        except:
            pass
    
    # Look for all image URLs in the HTML
    all_imgs = re.findall(r'src=["\']([^"\']+\.(?:jpg|jpeg|png|webp))["\']', html, re.IGNORECASE)
    print(f'\nAll images found: {len(all_imgs)}')
    for img in list(set(all_imgs))[:30]:
        print(f'  {img}')
    
    # Look for project links
    project_links = re.findall(r'href=["\']([^"\']*/project/[^"\']+)["\']', html)
    print(f'\nProject links found: {len(project_links)}')
    for link in list(set(project_links))[:10]:
        print(f'  {link}')
    
    return html

if __name__ == '__main__':
    fetch_makuake_data()