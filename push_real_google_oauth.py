import os
import base64
import json
import urllib.request
import time

TOKEN = input("Enter GitHub Personal Access Token: ").strip()
REPO = "Reddy-vignesh/TwinPath-AI"
ROOT = r"c:\Users\vighn\Documents\mine\Decision Ai Twin"

files_to_push = [
    ("backend/app/models/otp.py", os.path.join(ROOT, r"backend\app\models\otp.py")),
    ("backend/app/models/feedback.py", os.path.join(ROOT, r"backend\app\models\feedback.py")),
    ("backend/app/models/__init__.py", os.path.join(ROOT, r"backend\app\models\__init__.py")),
    ("backend/app/core/exceptions.py", os.path.join(ROOT, r"backend\app\core\exceptions.py")),
    ("backend/app/core/middleware.py", os.path.join(ROOT, r"backend\app\core\middleware.py")),
    ("backend/app/core/security.py", os.path.join(ROOT, r"backend\app\core\security.py")),
    ("backend/app/core/disposable_email.py", os.path.join(ROOT, r"backend\app\core\disposable_email.py")),
    ("backend/app/config.py", os.path.join(ROOT, r"backend\app\config.py")),
    ("backend/app/db/session.py", os.path.join(ROOT, r"backend\app\db\session.py")),
    ("backend/app/lifespan.py", os.path.join(ROOT, r"backend\app\lifespan.py")),
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
    ("frontend/src/components/layout/AppShell.tsx", os.path.join(ROOT, r"frontend\src\components\layout\AppShell.tsx")),
    ("frontend/src/components/layout/TopBar.tsx", os.path.join(ROOT, r"frontend\src\components\layout\TopBar.tsx")),
    ("frontend/src/pages/Dashboard.tsx", os.path.join(ROOT, r"frontend\src\pages\Dashboard.tsx")),
    ("frontend/src/index.css", os.path.join(ROOT, r"frontend\src\index.css")),
    ("frontend/src/stores/authStore.ts", os.path.join(ROOT, r"frontend\src\stores\authStore.ts")),
    ("frontend/src/stores/themeStore.ts", os.path.join(ROOT, r"frontend\src\stores\themeStore.ts"))
]

headers = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
}


def push_file(rel_path, abs_path, retries=3):
    with open(abs_path, 'rb') as f:
        content = base64.b64encode(f.read()).decode('utf-8')

    url = f"https://api.github.com/repos/{REPO}/contents/{rel_path}"

    # Get current file SHA (required for updates)
    sha = None
    for attempt in range(retries):
        try:
            req_get = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req_get, timeout=30) as resp:
                sha = json.loads(resp.read())["sha"]
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                break  # New file - no SHA needed
            time.sleep(2)
        except Exception:
            time.sleep(2)

    payload = {"message": f"Fix auth bugs: {rel_path}", "content": content}
    if sha:
        payload["sha"] = sha

    data = json.dumps(payload).encode('utf-8')

    for attempt in range(retries):
        try:
            req_put = urllib.request.Request(url, data=data, headers=headers, method="PUT")
            with urllib.request.urlopen(req_put, timeout=30) as resp:
                print(f"SUCCESS: Pushed {rel_path} to GitHub!")
                return True
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8')
            print(f"  Attempt {attempt+1} failed ({e.code}): {body[:150]}")
            time.sleep(3)
        except Exception as e:
            print(f"  Attempt {attempt+1} connection error: {e}, retrying...")
            time.sleep(3)

    print(f"FAILED after {retries} attempts: {rel_path}")
    return False


success_count = 0
fail_count = 0

for rel_path, abs_path in files_to_push:
    result = push_file(rel_path, abs_path)
    if result:
        success_count += 1
    else:
        fail_count += 1
    time.sleep(0.5)

print(f"\nPushed {success_count} files. Failed: {fail_count}.")
if fail_count == 0:
    print("ALL FILES PUSHED TO GITHUB SUCCESSFULLY!")
