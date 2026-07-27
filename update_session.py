import os
import base64
import json
import urllib.request

TOKEN = input("Enter GitHub Personal Access Token: ").strip()
REPO = "Reddy-vignesh/TwinPath-AI"
PATH = "backend/app/db/session.py"
LOCAL_FP = r"c:\Users\vighn\Documents\mine\Decision Ai Twin\project_github\backend\app\db\session.py"

with open(LOCAL_FP, 'rb') as f:
    content = base64.b64encode(f.read()).decode('utf-8')

url = f"https://api.github.com/repos/{REPO}/contents/{PATH}"
headers = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
}

req_get = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req_get) as resp:
    sha = json.loads(resp.read())["sha"]

data = json.dumps({
    "message": "Fix statement cache size for Supabase pooler compatibility",
    "content": content,
    "sha": sha
}).encode('utf-8')

req_put = urllib.request.Request(url, data=data, headers=headers, method="PUT")
with urllib.request.urlopen(req_put) as resp:
    print(f"✅ SUCCESS: Updated {PATH} on GitHub!")
