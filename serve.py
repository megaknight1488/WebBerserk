"""
Локальный статический сервер с поддержкой HTTP Range (bytes=…).

Нужен для перемотки больших MP4: браузер шлёт Range, а встроенный
`python -m http.server` в текущих версиях CPython отдаёт только целый файл 200 OK
без 206 Partial Content — из-за этого scrubber в <video> часто не работает.

Запуск из папки проекта:
  python serve.py
  python serve.py 9000
"""

from __future__ import annotations

import http.server
import os
import shutil
import socketserver
import sys
from http import HTTPStatus


class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler + корректные ответы 206 для Range."""

    protocol_version = "HTTP/1.1"
    _range_length: int | None = None

    def copyfile(self, source, outputfile):
        if self._range_length is not None:
            shutil.copyfileobj(source, outputfile, self._range_length)
            self._range_length = None
        else:
            shutil.copyfileobj(source, outputfile)

    def send_head(self):
        self._range_length = None
        path = self.translate_path(self.path)

        if os.path.isdir(path):
            return super().send_head()

        if not os.path.isfile(path):
            return super().send_head()

        range_header = self.headers.get("Range") or self.headers.get("range")
        if not range_header or not range_header.strip().lower().startswith("bytes="):
            return super().send_head()

        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None

        try:
            fs = os.fstat(f.fileno())
            size = fs[6]
            parsed = _parse_single_byte_range(range_header, size)
            if parsed is None:
                self.send_error(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                f.close()
                return None

            start, end = parsed
            if start > end or start >= size:
                self.send_error(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                f.close()
                return None

            end = min(end, size - 1)
            chunk_len = end - start + 1
            ctype = self.guess_type(path)

            self.send_response(HTTPStatus.PARTIAL_CONTENT)
            self.send_header("Content-type", ctype)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(chunk_len))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            f.seek(start)
            self._range_length = chunk_len
            return f
        except Exception:
            f.close()
            raise


def _parse_single_byte_range(range_header: str, size: int) -> tuple[int, int] | None:
    """Разобрать один диапазон bytes=… (без multipart). Несовместимое — None."""
    spec = range_header.strip()[6:].strip().split(",")[0].strip()
    if "-" not in spec:
        return None
    left, right = spec.split("-", 1)
    try:
        if left == "":
            if right == "":
                return None
            suffix = int(right)
            if suffix <= 0:
                return None
            start = max(0, size - suffix)
            end = size - 1
        elif right == "":
            start = int(left)
            end = size - 1
        else:
            start = int(left)
            end = int(right)
    except ValueError:
        return None
    if start < 0 or end < start:
        return None
    return start, end


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    directory = os.path.dirname(os.path.abspath(__file__))

    class _BoundHandler(RangeHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", port), _BoundHandler) as httpd:
        print(f"Serving {directory}")
        print(f"Open http://127.0.0.1:{port}/  (byte-range enabled — video seek works)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
