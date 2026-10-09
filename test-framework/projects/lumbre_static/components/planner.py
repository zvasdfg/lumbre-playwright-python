"""Planner interactions only: assertions and scenario data stay in tests."""
class Planner:
    def __init__(self, page):
        self.page = page

    def configure(self, goal, equipment, fuel):
        self.page.get_by_label("Objetivo de cocción", exact=True).select_option(goal)
        self.page.get_by_label("Equipo", exact=True).select_option(equipment)
        field = self.page.get_by_label("Combustible principal", exact=True)
        if field.is_enabled():
            field.select_option(fuel)
        self.page.get_by_label("Horas de cocción", exact=True).fill("2")
        for name in ("capabilityVerified", "fuelVerified", "smokeVerified"):
            for control in self.page.locator(f'[name="{name}"]').all():
                control.check()

    def build(self):
        self.page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
