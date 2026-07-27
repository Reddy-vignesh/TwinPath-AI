import os
import base64
import json
import urllib.request

TOKEN = input("Enter GitHub Personal Access Token: ").strip()
REPO = "Reddy-vignesh/TwinPath-AI"
ROOT = r"c:\Users\vighn\Documents\mine\Decision Ai Twin"

files_to_push = [
    ("backend/app/models/otp.py", os.path.join(ROOT, r"backend\app\models\otp.py")),
    ("backend/app/models/feedback.py", os.path.join(ROOT, r"backend\app\models\feedback.py")),
    ("backend/app/models/__init__.py", os.path.join(ROOT, r"backend\app\models\__init__.py")),
    ("backend/app/core/exceptions.py", os.path.join(ROOT, r"backend\app\core\exceptions.py")),
    ("backend/app/config.py", os.path.join(ROOT, r"backend\app\config.py")),
    ("backend/app/schemas/auth.py", os.path.join(ROOT, r"backend\app\schemas\auth.py")),
    ("backend/app/schemas/google_auth.py", os.path.join(ROOT, r"backend\app\schemas\google_auth.py")),
    ("backend/app/api/v1/endpoints/auth.py", os.path.join(ROOT, r"backend\app\api\v1\endpoints\auth.py")),
    ("backend/app/api/v1/endpoints/feedback.py", os.path.join(ROOT, r"backend\app\api\v1\endpoints\feedback.py")),
    ("backend/app/api/v1/endpoints/resume.py", os.path.join(ROOT, r"backend\app\api\v1\endpoints\resume.py")),
    ("backend/app/api/v1/router.py", os.path.join(ROOT, r"backend\app\api\v1\router.py")),
    ("backend/requirements.txt", os.path.join(ROOT, r"backend\requirements.txt")),
    ("frontend/package.json", os.path.join(ROOT, r"frontend\package.json")),
    ("frontend/vite.config.ts", os.path.join(ROOT, r"frontend\vite.config.ts")),
    ("frontend/src/api/client.ts", os.path.join(ROOT, r"frontend\src\api\client.ts")),
    ("frontend/src/main.tsx", os.path.join(ROOT, r"frontend\src\main.tsx")),
    ("frontend/src/pages/Login.tsx", os.path.join(ROOT, r"frontend\src\pages\Login.tsx")),
    ("frontend/src/pages/Profile.tsx", os.path.join(ROOT, r"frontend\src\pages\Profile.tsx")),
    ("frontend/src/pages/Simulator.tsx", os.path.join(ROOT, r"frontend\src\pages\Simulator.tsx")),
    ("frontend/src/pages/TwinVisualizer.tsx", os.path.join(ROOT, r"frontend\src\pages\TwinVisualizer.tsx")),
    ("frontend/src/components/FeedbackModal.tsx", os.path.join(ROOT, r"frontend\src\components\FeedbackModal.tsx")),
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
        "message": f"Enable real Google OAuth Pop-up & Database-only feedback: {rel_path}",
        "content": content
    }
    if sha:
        payload["sha"] = sha

    data = json.dumps(payload).encode('utf-8')
    req_put = urllib.request.Request(url, data=data, headers=headers, method="PUT")
    with urllib.request.urlopen(req_put) as resp:
        print(f"✅ SUCCESS: Pushed {rel_path} to GitHub!")

print("\n🎉 REAL GOOGLE OAUTH POPUP PUSHED TO GITHUB!")
