"""
run_frontend.py
---------------
A Python service that serves the static frontend and proxies chat completions
through the Groq API using GROQ_API_KEY from the environment.
"""

import http.server
import socketserver
import os
import json
import urllib.request
import urllib.error

PORT = int(os.getenv('PORT', '3000'))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
GROQ_API_URL = os.getenv('GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path != '/api/chat':
            return super().do_POST()

        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Invalid JSON payload'}).encode('utf-8'))
            return

        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Server misconfiguration: missing GROQ_API_KEY'}).encode('utf-8'))
            return

        proxy_payload = {
            'model': payload.get('model', 'llama-3.3-70b-versatile'),
            'messages': payload.get('messages', []),
            'temperature': payload.get('temperature', 0.3),
            'max_tokens': payload.get('max_tokens', 1500),
            'top_p': payload.get('top_p', 1),
            'reasoning_effort': payload.get('reasoning_effort', 'medium'),
        }

        request = urllib.request.Request(
            GROQ_API_URL,
            data=json.dumps(proxy_payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {groq_api_key}'
            },
            method='POST'
        )

        try:
            with urllib.request.urlopen(request) as response:
                response_body = response.read()
                status_code = response.getcode()
                content_type = response.headers.get('Content-Type', 'application/json')
        except urllib.error.HTTPError as e:
            response_body = e.read()
            status_code = e.code
            content_type = e.headers.get('Content-Type', 'application/json')
        except urllib.error.URLError as e:
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Upstream request failed', 'details': str(e)}).encode('utf-8'))
            return

        self.send_response(status_code)
        self.send_header('Content-Type', content_type)
        self.end_headers()
        self.wfile.write(response_body)


def start_server():
    with socketserver.ThreadingTCPServer(('', PORT), Handler) as httpd:
        print('\n' + '='*50)
        print('🚀 Frontend Server Started Successfully!')
        print(f'👉 Local URL: http://localhost:{PORT}')
        print('='*50 + '\n')

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n👋 Shutting down frontend server.')
            httpd.server_close()


if __name__ == '__main__':
    start_server()
