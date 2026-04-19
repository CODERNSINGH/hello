"""
run_frontend.py
---------------
A simple Python script to serve the frontend Vanilla HTML/CSS/JS files locally.
"""

import http.server
import socketserver
import os

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

CONFIG_FILE = os.path.join(DIRECTORY, 'config.js')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)


def generate_config_js():
    groq_api_key = os.getenv('GROQ_API_KEY')
    groq_api_url = os.getenv('GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions')

    config_content = f"window.APP_CONFIG = window.APP_CONFIG || {{\n" \
                     f"  GROQ_API_KEY: {repr(groq_api_key)},\n" \
                     f"  GROQ_API_URL: {repr(groq_api_url)}\n" \
                     f"}};\n"

    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        f.write(config_content)
    print(f"Generated config.js with GROQ_API_URL={groq_api_url}")

def start_server():
    generate_config_js()
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("\n" + "="*50)
        print("🚀 Frontend Server Started Successfully!")
        print(f"👉 Local URL: http://localhost:{PORT}")
        print("="*50 + "\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Shutting down frontend server.")
            httpd.server_close()

if __name__ == "__main__":
    start_server()
