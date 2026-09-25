import pytest

from automation.core.config import Settings

pytestmark = [
    pytest.mark.framework_unit,
    pytest.mark.case(
        "FRAMEWORK-001",
        "Framework settings resolve deterministic defaults and environment overrides",
    ),
]


@pytest.mark.parametrize(
    ("environment", "expected"),
    [
        (
            {},
            {
                "base_url": "http://127.0.0.1:3000",
                "headless": True,
                "project_name": "Lumbre",
                "locale": "es-MX",
                "viewport": (1440, 1000),
                "worker_base_urls": (),
                "proxy_server": None,
            },
        ),
        (
            {
                "BASE_URL": "https://example.test/",
                "HEADLESS": "false",
                "AUTOMATION_PROJECT": "Example Store",
                "LOCALE": "en-US",
                "VIEWPORT_WIDTH": "1280",
                "VIEWPORT_HEIGHT": "720",
                "AUTOMATION_WORKER_BASE_URLS": ("http://localhost:3200/, http://localhost:3201"),
                "PLAYWRIGHT_PROXY": "http://proxy.example.test:8080",
            },
            {
                "base_url": "https://example.test",
                "headless": False,
                "project_name": "Example Store",
                "locale": "en-US",
                "viewport": (1280, 720),
                "worker_base_urls": (
                    "http://localhost:3200",
                    "http://localhost:3201",
                ),
                "proxy_server": "http://proxy.example.test:8080",
            },
        ),
    ],
    ids=["defaults", "overrides"],
)
def test_settings_resolve_environment(
    environment: dict[str, str],
    expected: dict[str, object],
) -> None:
    settings = Settings.from_environment(environment)

    assert settings.base_url == expected["base_url"]
    assert settings.headless is expected["headless"]
    assert settings.project_name == expected["project_name"]
    assert settings.locale == expected["locale"]
    assert (settings.viewport_width, settings.viewport_height) == expected["viewport"]
    assert settings.worker_base_urls == expected["worker_base_urls"]
    assert settings.proxy_server == expected["proxy_server"]


def test_settings_reject_non_numeric_timeout() -> None:
    with pytest.raises(ValueError):
        Settings.from_environment({"DEFAULT_TIMEOUT_MS": "ten-seconds"})


@pytest.mark.parametrize(
    ("worker_id", "expected_url"),
    [
        ("master", "http://localhost:3000"),
        ("gw0", "http://localhost:3200"),
        ("gw1", "http://localhost:3201"),
    ],
)
def test_settings_resolve_worker_target(worker_id: str, expected_url: str) -> None:
    settings = Settings.from_environment(
        {
            "BASE_URL": "http://localhost:3000",
            "AUTOMATION_WORKER_BASE_URLS": ("http://localhost:3200,http://localhost:3201"),
        }
    )

    assert settings.base_url_for_worker(worker_id) == expected_url


def test_settings_reject_missing_worker_target() -> None:
    settings = Settings.from_environment({"AUTOMATION_WORKER_BASE_URLS": "http://localhost:3200"})

    with pytest.raises(ValueError, match="No isolated base URL configured for gw1"):
        settings.base_url_for_worker("gw1")
