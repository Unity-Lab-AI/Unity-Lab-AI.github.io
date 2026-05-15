# DUNGEON MASTER: THE HUNT -- dev static server with no-cache headers.
#
# Wraps Python's stdlib http.server with Cache-Control: no-store on every
# response. Without this, browsers aggressively cache .js / .html / .css and
# JS edits don't show up until the user hard-refreshes (Ctrl+Shift+R). Bound
# to localhost:9535 by default; pass a port as the first arg to change.
#
# Used by start.bat and start.sh in preference to bare `python -m http.server`.

from __future__ import annotations

import sys
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        # Compact one-line access log -- same shape as the stdlib default minus the date prefix.
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main() -> int:
    port = 9535
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            sys.stderr.write("usage: serve.py [port]\n")
            return 2

    # Serve from the project root (parent of scripts/), not the script's own dir.
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_root)

    server = ThreadingHTTPServer(('', port), NoCacheHandler)
    sys.stdout.write("Serving %s on http://localhost:%d/ (no-cache headers active, Ctrl+C to stop)\n" % (project_root, port))
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.stdout.write("\nShutting down.\n")
        server.server_close()
        return 0
    return 0


if __name__ == '__main__':
    sys.exit(main())
