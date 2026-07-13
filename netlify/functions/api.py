import copy
import os
import sys
from pathlib import Path

from mangum import Mangum

BACKEND_DIR = Path(__file__).resolve().parents[2] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DATABASE_PATH", "/tmp/app.db")

from app.main import app

FUNCTION_PREFIX = "/.netlify/functions/api"
asgi_handler = Mangum(app, lifespan="off")


def _strip_function_prefix(path: str) -> str:
    if path.startswith(FUNCTION_PREFIX):
        trimmed = path[len(FUNCTION_PREFIX):]
        return trimmed or "/"
    return path or "/"


def handler(event, context):
    normalized_event = copy.deepcopy(event)
    raw_path = normalized_event.get("rawPath") or normalized_event.get("path") or "/"
    stripped_path = _strip_function_prefix(raw_path)
    normalized_event["rawPath"] = stripped_path
    normalized_event["path"] = stripped_path

    request_context = normalized_event.get("requestContext") or {}
    http_context = request_context.get("http") or {}
    if http_context:
        http_context["path"] = stripped_path
        request_context["http"] = http_context
        normalized_event["requestContext"] = request_context

    return asgi_handler(normalized_event, context)
