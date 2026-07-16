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
            },
            {
                "base_url": "https://example.test",
                "headless": False,
                "project_name": "Example Store",
                "locale": "en-US",
                "viewport": (1280, 720),
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


def test_settings_reject_non_numeric_timeout() -> None:
    with pytest.raises(ValueError):
        Settings.from_environment({"DEFAULT_TIMEOUT_MS": "ten-seconds"})
