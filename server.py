"""
Resources Technologies - Lightweight CMS Backend Server
Serves static frontend assets and provides a RESTful API for Project CMS management.
Zero external dependencies (uses standard library Python 3.10+).
"""

import http.server
import socketserver
import json
import os
import re
import urllib.parse
from pathlib import Path

PORT = 3000
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "projects.json"

def read_projects():
    if not DATA_FILE.exists():
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            f.write("[]")
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {DATA_FILE}: {e}")
        return []

def write_projects(projects):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

class CMSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable aggressive caching for API calls
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        # Route aliases
        if path == "/admin":
            self.send_response(301)
            self.send_header("Location", "/admin.html")
            self.end_headers()
            return

        if path == "/login":
            self.send_response(301)
            self.send_header("Location", "/login.html")
            self.end_headers()
            return

        # API Routes
        if path == "/api/projects":
            projects = read_projects()
            data = json.dumps(projects, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        match = re.match(r"^/api/projects/([^/]+)$", path)
        if match:
            slug = match.group(1)
            projects = read_projects()
            project = next((p for p in projects if p.get("slug") == slug or p.get("id") == slug), None)
            if project:
                data = json.dumps(project, ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                err = json.dumps({"error": "Project not found", "slug": slug}).encode("utf-8")
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return

        # Fallback to standard static file server
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path == "/api/auth/login":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                creds = json.loads(body)
                user = creds.get("username", "").strip().lower()
                pw = creds.get("password", "")
                if user == "admin" and pw == "ResourcesTech2026!":
                    import time
                    token = f"rt_auth_{int(time.time())}"
                    res = json.dumps({"success": True, "token": token, "username": "admin"}).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(res)))
                    self.end_headers()
                    self.wfile.write(res)
                    return
                else:
                    err = json.dumps({"error": "Invalid username or password"}).encode("utf-8")
                    self.send_response(401)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(err)))
                    self.end_headers()
                    self.wfile.write(err)
                    return
            except Exception as e:
                err = json.dumps({"error": "Malformed request", "details": str(e)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

        if path == "/api/projects":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                new_project = json.loads(body)
            except Exception as e:
                err = json.dumps({"error": "Invalid JSON", "details": str(e)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

            projects = read_projects()
            title = new_project.get("title", "Untitled Project")
            slug = new_project.get("slug") or slugify(title)
            
            # Ensure unique slug
            base_slug = slug
            counter = 1
            while any(p.get("slug") == slug for p in projects):
                slug = f"{base_slug}-{counter}"
                counter += 1

            new_project["id"] = new_project.get("id") or f"proj-{int(os.times().elapsed * 1000)}"
            new_project["slug"] = slug

            # Normalize array fields
            if isinstance(new_project.get("overview"), str):
                new_project["overview"] = [p.strip() for p in new_project["overview"].split("\n") if p.strip()]
            if isinstance(new_project.get("systems"), str):
                new_project["systems"] = [s.strip() for s in new_project["systems"].split("\n") if s.strip()]
            if isinstance(new_project.get("approach"), str):
                new_project["approach"] = [a.strip() for a in new_project["approach"].split("\n") if a.strip()]
            if isinstance(new_project.get("gallery"), str):
                new_project["gallery"] = [g.strip() for g in new_project["gallery"].split(",") if g.strip()]

            projects.append(new_project)
            write_projects(projects)

            res = json.dumps(new_project, ensure_ascii=False).encode("utf-8")
            self.send_response(201)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(res)))
            self.end_headers()
            self.wfile.write(res)
            return

        if path == "/api/upload":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                payload = json.loads(body)
                raw_filename = payload.get("filename", "upload.png")
                safe_name = re.sub(r"[^\w\.-]", "_", raw_filename)
                
                import time
                unique_name = f"{int(time.time() * 1000)}_{safe_name}"
                upload_dir = BASE_DIR / "assets" / "uploads"
                upload_dir.mkdir(parents=True, exist_ok=True)

                data_base64 = payload.get("data", "")
                if "," in data_base64:
                    data_base64 = data_base64.split(",", 1)[1]
                
                import base64
                file_bytes = base64.b64decode(data_base64)
                target_path = upload_dir / unique_name
                with open(target_path, "wb") as f:
                    f.write(file_bytes)
                
                res = json.dumps({"url": f"assets/uploads/{unique_name}"}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(res)))
                self.end_headers()
                self.wfile.write(res)
                return
            except Exception as e:
                err = json.dumps({"error": "Upload failed", "details": str(e)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

        self.send_response(404)
        self.end_headers()

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        match = re.match(r"^/api/projects/([^/]+)$", path)

        if match:
            slug = match.group(1)
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                update_data = json.loads(body)
            except Exception as e:
                err = json.dumps({"error": "Invalid JSON", "details": str(e)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

            projects = read_projects()
            idx = next((i for i, p in enumerate(projects) if p.get("slug") == slug or p.get("id") == slug), -1)

            if idx == -1:
                err = json.dumps({"error": "Project not found"}).encode("utf-8")
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

            # Update fields
            project = projects[idx]
            for key, val in update_data.items():
                if key != "id": # preserve id
                    project[key] = val

            # Normalize array fields
            if isinstance(project.get("overview"), str):
                project["overview"] = [p.strip() for p in project["overview"].split("\n") if p.strip()]
            if isinstance(project.get("systems"), str):
                project["systems"] = [s.strip() for s in project["systems"].split("\n") if s.strip()]
            if isinstance(project.get("approach"), str):
                project["approach"] = [a.strip() for a in project["approach"].split("\n") if a.strip()]
            if isinstance(project.get("gallery"), str):
                project["gallery"] = [g.strip() for g in project["gallery"].split(",") if g.strip()]

            projects[idx] = project
            write_projects(projects)

            res = json.dumps(project, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(res)))
            self.end_headers()
            self.wfile.write(res)
            return

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        match = re.match(r"^/api/projects/([^/]+)$", path)

        if match:
            slug = match.group(1)
            projects = read_projects()
            idx = next((i for i, p in enumerate(projects) if p.get("slug") == slug or p.get("id") == slug), -1)

            if idx == -1:
                err = json.dumps({"error": "Project not found"}).encode("utf-8")
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
                return

            removed = projects.pop(idx)
            write_projects(projects)

            res = json.dumps({"success": True, "deleted": removed}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(res)))
            self.end_headers()
            self.wfile.write(res)
            return

        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    os.chdir(str(BASE_DIR))
    # Allow address reuse to prevent WinError 10048 during fast restart
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CMSRequestHandler) as httpd:
        print(f"Resources Tech CMS Server running at http://localhost:{PORT}")
        print(f"  - Website: http://localhost:{PORT}/")
        print(f"  - Admin CMS Dashboard: http://localhost:{PORT}/admin.html")
        print(f"  - API Endpoints: http://localhost:{PORT}/api/projects")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()
