import os
import base64
import json
import urllib.request

TOKEN = input("Enter GitHub Personal Access Token: ").strip()
REPO = "Reddy-vignesh/TwinPath-AI"
ROOT = r"c:\Users\vighn\Documents\mine\Decision Ai Twin\frontend\src\pages"

files_to_update = [
    "frontend/src/pages/Dashboard.tsx",
    "frontend/src/pages/Recommendations.tsx"
]

for rel_path in files_to_update:
    filename = os.path.basename(rel_path)
    fp = os.path.join(ROOT, filename)
    with open(fp, 'rb') as f:
        content = base64.b64encode(f.read()).decode('utf-8')
    
    url = f"https://api.github.com/repos/{REPO}/contents/{rel_path}"
    headers = {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }

    req_get = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req_get) as resp:
        sha = json.loads(resp.read())["sha"]

    data = json.dumps({
        "message": f"Fix onboarding prompt for fresh 0% completeness profiles in {filename}",
        "content": content,
        "sha": sha
    }).encode('utf-8')

    req_put = urllib.request.Request(url, data=data, headers=headers, method="PUT")
    with urllib.request.urlopen(req_put) as resp:
        print(f"✅ SUCCESS: Updated {rel_path} on GitHub!")
