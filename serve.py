from __future__ import annotations

import argparse
import functools
import http.server
import socketserver
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the docs directory.")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    args = parser.parse_args()

    docs_dir = Path(__file__).resolve().parent / "docs"
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(docs_dir))

    with socketserver.TCPServer(("", args.port), handler) as httpd:
        print(f"Serving {docs_dir} at http://localhost:{args.port}")
        print("Press Ctrl+C to stop.")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
