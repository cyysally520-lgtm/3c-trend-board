import re, json

html = open('test_makuake.html', 'r', encoding='utf-8').read()

# Find all image URLs
imgs = re.findall(r'<img[^>]+src=["\'](https?://[^"\']+)["\'][^>]*>', html)
print('Images found:', len(imgs))
for img in imgs[:30]:
    print(img)

# Find project data - look for JSON data in script tags
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
print('\nScripts found:', len(scripts))

for i, script in enumerate(scripts):
    if 'project' in script.lower() or 'image' in script.lower():
        print(f'\n--- Script {i} (len={len(script)}) ---')
        print(script[:500])
        
# Try to find data attributes
print('\n--- Data attributes ---')
projects = re.findall(r'data-project-id=["\']([^"\']+)["\'][^>]*data-image=["\']([^"\']+)["\']', html)
print('Projects with data attrs:', len(projects))
for p in projects[:10]:
    print(p)