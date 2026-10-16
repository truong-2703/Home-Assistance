"""Tự động hoàn tất bước cài đặt ban đầu (onboarding) của Home Assistant.

Tạo tài khoản quản trị, đặt ngôn ngữ tiếng Việt và bỏ qua các màn hình hỏi đáp,
để khi mở trình duyệt chỉ cần đăng nhập là vào thẳng dashboard demo.
Chỉ dùng thư viện chuẩn của Python. Chạy lại nhiều lần cũng không sao.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HA_URL = os.environ.get("HA_URL", "http://localhost:8123").rstrip("/")
NAME = os.environ.get("HA_NAME", "TruongHA Demo")
USERNAME = os.environ.get("HA_USERNAME", "truongha")
PASSWORD = os.environ.get("HA_PASSWORD", "truongha123")
CLIENT_ID = f"{HA_URL}/"


def request(method, path, data=None, token=None, form=False):
    headers = {}
    body = None
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode()
            headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{HA_URL}{path}", data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else {}


def wait_for_ha():
    for _ in range(180):
        try:
            return request("GET", "/api/onboarding")
        except (urllib.error.URLError, ConnectionError, OSError):
            time.sleep(2)
    sys.exit("Không kết nối được Home Assistant sau 6 phút.")


def main():
    steps = {s["step"]: s["done"] for s in wait_for_ha()}
    if steps.get("user"):
        print("Đã có tài khoản, bỏ qua bước tạo tài khoản.")
        return

    auth_code = request(
        "POST",
        "/api/onboarding/users",
        {
            "client_id": CLIENT_ID,
            "name": NAME,
            "username": USERNAME,
            "password": PASSWORD,
            "language": "vi",
        },
    )["auth_code"]
    token = request(
        "POST",
        "/auth/token",
        {"grant_type": "authorization_code", "code": auth_code, "client_id": CLIENT_ID},
        form=True,
    )["access_token"]

    for path, data in (
        ("/api/onboarding/core_config", {}),
        ("/api/onboarding/analytics", {}),
        ("/api/onboarding/integration", {"client_id": CLIENT_ID, "redirect_uri": f"{HA_URL}/?auth_callback=1"}),
    ):
        try:
            request("POST", path, data, token=token)
        except urllib.error.HTTPError as err:
            # 403 = bước này đã hoàn tất từ trước
            if err.code != 403:
                raise

    print(f"Xong! Đăng nhập bằng tài khoản: {USERNAME} / {PASSWORD}")


if __name__ == "__main__":
    main()
