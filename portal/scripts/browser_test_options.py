"""Launch options shared by standalone browser regressions and their Pytest adapters."""

import os


def browser_launch_options():
    return {
        "headless": os.environ.get("LUMBRE_TEST_HEADED", "0") != "1",
        "slow_mo": int(os.environ.get("LUMBRE_TEST_SLOWMO", "0")),
    }
