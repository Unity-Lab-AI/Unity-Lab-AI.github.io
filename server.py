#!/usr/bin/env python3
"""
Unity AI Lab - Local Development Server
Adds proper CORS headers for cross-origin image loading
"""

import http.server
import socketserver

PORT = 3000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        # NOTE: Do NOT add Cross-Origin-Embedder-Policy header!
        # COEP blocks cross-origin images (like Pollinations) that don't send CORP headers
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
    print(f"\n  Unity AI Lab - Local Server")
    print(f"  ============================")
    print(f"  Serving on http://localhost:{PORT}")
    print(f"  CORS headers enabled")
    print(f"  Press Ctrl+C to stop\n")
    httpd.serve_forever()
