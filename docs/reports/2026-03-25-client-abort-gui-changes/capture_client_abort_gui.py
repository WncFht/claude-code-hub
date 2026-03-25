from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:23000"
LOCALE = "zh-CN"
COOKIE_FILE = Path("/tmp/cch-cookies.txt")
REPORT_DIR = Path(
    "/home/fanghaotian/Desktop/src/cch/claude-code-hub/docs/reports/2026-03-25-client-abort-gui-changes"
)
FIGURE_DIR = REPORT_DIR / "figures"
METADATA_PATH = REPORT_DIR / "capture-metadata.json"
EDGE_PATH = "/usr/bin/microsoft-edge-stable"


def load_auth_cookie() -> dict[str, str]:
    for line in COOKIE_FILE.read_text(encoding="utf-8").splitlines():
        if "auth-token" not in line:
            continue
        parts = line.split("\t")
        return {
            "name": parts[-2],
            "value": parts[-1],
        }
    raise RuntimeError(f"auth-token not found in {COOKIE_FILE}")


def wait_for_logs_ready(page) -> None:
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    page.wait_for_selector("text=客户端中断分类", timeout=20000)


def open_first_status_dialog(page) -> None:
    status_buttons = page.locator("button").filter(has_text="499")
    count = status_buttons.count()
    if count == 0:
      raise RuntimeError("No 499 status button found on logs page")
    status_buttons.first.click()
    page.wait_for_timeout(1200)
    page.wait_for_selector("text=请求详情", timeout=20000)


def main() -> None:
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)
    cookie = load_auth_cookie()

    captures: list[dict[str, str]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=EDGE_PATH, headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 2200})
        context.add_cookies(
            [
                {
                    "name": cookie["name"],
                    "value": cookie["value"],
                    "domain": "127.0.0.1",
                    "path": "/",
                    "httpOnly": True,
                    "sameSite": "Lax",
                }
            ]
        )

        page = context.new_page()

        logs_session_url = (
            f"{BASE_URL}/{LOCALE}/dashboard/logs?clientAbortOutcome=session_continued&statusCode=499"
        )
        page.goto(logs_session_url, wait_until="networkidle")
        wait_for_logs_ready(page)
        logs_session_png = FIGURE_DIR / "logs-session-continued-page.png"
        page.screenshot(path=str(logs_session_png), full_page=True)
        captures.append(
            {
                "id": "gui-logs-session-continued-page",
                "path": str(logs_session_png),
                "url": page.url,
                "note": "日志页：筛选 session_continued 后的整体页面",
            }
        )

        open_first_status_dialog(page)
        logs_session_detail_png = FIGURE_DIR / "logs-session-continued-detail.png"
        page.screenshot(path=str(logs_session_detail_png), full_page=True)
        captures.append(
            {
                "id": "gui-logs-session-continued-detail",
                "path": str(logs_session_detail_png),
                "url": page.url,
                "note": "日志详情：session_continued 明细弹窗",
            }
        )

        page.goto(
            f"{BASE_URL}/{LOCALE}/dashboard/logs?clientAbortOutcome=after_stream_start&statusCode=499",
            wait_until="networkidle",
        )
        wait_for_logs_ready(page)
        open_first_status_dialog(page)
        logs_after_stream_detail_png = FIGURE_DIR / "logs-after-stream-detail.png"
        page.screenshot(path=str(logs_after_stream_detail_png), full_page=True)
        captures.append(
            {
                "id": "gui-logs-after-stream-detail",
                "path": str(logs_after_stream_detail_png),
                "url": page.url,
                "note": "日志详情：after_stream_start 明细弹窗（含长时请求样例）",
            }
        )

        page.goto(f"{BASE_URL}/{LOCALE}/dashboard/availability", wait_until="networkidle")
        page.wait_for_timeout(3500)
        try:
            page.wait_for_selector("text=客户端中断", timeout=20000)
        except PlaywrightTimeoutError as exc:
            raise RuntimeError("Availability page did not render client abort panel in time") from exc

        availability_png = FIGURE_DIR / "availability-overview.png"
        page.screenshot(path=str(availability_png), full_page=True)
        captures.append(
            {
                "id": "gui-availability-overview",
                "path": str(availability_png),
                "url": page.url,
                "note": "availability 页面：overview 与 client abort counters",
            }
        )

        browser.close()

    METADATA_PATH.write_text(
        json.dumps(
            {
                "capturedAt": "2026-03-25",
                "baseUrl": BASE_URL,
                "locale": LOCALE,
                "captures": captures,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
