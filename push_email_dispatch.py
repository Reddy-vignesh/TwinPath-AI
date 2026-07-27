import os
import base64
import json
import urllib.request

TOKEN = input("Enter GitHub Personal Access Token: ").strip()
REPO = "Reddy-vignesh/TwinPath-AI"
ROOT = r"c:\Users\vighn\Documents\mine\Decision Ai Twin"

files_to_push = [
    ("backend/app/api/v1/endpoints/feedback.py", os.path.join(ROOT, r"backend\app\api\v1\endpoints\feedback.py")),
    ("frontend/src/components/layout/AppShell.tsx", os.path.join(ROOT, r"frontend\src\components\layout\AppShell.tsx"))
]

headers = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
}

for rel_path, abs_path in files_to_push:
    with open(abs_path, 'rb') as f:
        content = base64.b64encode(f.read()).decode('utf-8')
    
    url = f"https://api.github.com/repos/{REPO}/contents/{rel_path}"
    
    sha = None
    try:
        req_get = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req_get) as resp:
            sha = json.loads(resp.read())["sha"]
    except Exception:
        pass

    payload = {
        "message": f"Enable direct email delivery to temporaryymail001@gmail.com: {rel_path}",
        "content": content
    }
    if sha:
        payload["sha"] = sha

    data = json.dumps(payload).encode('utf-8')
    req_put = urllib.request.Request(url, data=data, headers=headers, method="PUT")
    with urllib.request.urlopen(req_put) as resp:
        print(f"✅ SUCCESS: Pushed {rel_path} to GitHub!")

print("\n🎉 DIRECT EMAIL DISPATCH PUSHED TO GITHUB!")
