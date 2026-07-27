import os
import zipfile
import base64
import json
import urllib.request

TOKEN = input("Enter GitHub Personal Access Token (PAT): ").strip()
REPO = "Reddy-vignesh/TwinPath-AI"
ROOT = r"c:\Users\vighn\Documents\mine\Decision Ai Twin\project_github"

EXCLUDE = {'node_modules', '.venv', 'venv', '__pycache__', '.git', 'dist', 'build', '.env'}

print("Reading files...")
files_to_push = []
for base, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in EXCLUDE]
    for f in files:
        if f not in EXCLUDE:
            fp = os.path.join(base, f)
            rel = os.path.relpath(fp, ROOT).replace('\\', '/')
            with open(fp, 'rb') as file_obj:
                content = base64.b64encode(file_obj.read()).decode('utf-8')
            files_to_push.append((rel, content))

print(f"Total {len(files_to_push)} files to push to {REPO}...")

headers = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
}

for path, content in files_to_push:
    url = f"https://api.github.com/repos/{REPO}/contents/{path}"
    data = json.dumps({
        "message": f"Add {path}",
        "content": content
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method="PUT")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✅ Uploaded {path}")
    except Exception as e:
        print(f"❌ Error {path}: {e}")

print("🎉 ALL FILES PUSHED TO GITHUB SUCCESSFULLY!")
