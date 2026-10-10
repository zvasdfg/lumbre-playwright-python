"""FirePlanner interactions only: assertions and scenario data stay in tests."""


class FirePlanner:
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

    def add_stage(
        self,
        index,
        *,
        name,
        kind="coccion",
        goal="asar",
        method="directo",
        temperature="200",
        surface="rejilla",
        duration="30 min",
        notes="",
    ):
        self.page.get_by_role("button", name="Añadir etapa", exact=True).click()
        self.page.get_by_label(f"Nombre de etapa {index}", exact=True).fill(name)
        self.page.get_by_label(f"Tipo de etapa {index}", exact=True).select_option(kind)
        if kind != "pausa":
            self.page.get_by_label(f"Objetivo de etapa {index}", exact=True).select_option(goal)
            self.page.get_by_label(f"Método de etapa {index}", exact=True).select_option(method)
            self.page.locator(".planner-stage-editor fieldset").nth(index - 1).locator("input").nth(
                1
            ).fill(temperature)
            self.page.get_by_label(f"Soporte de etapa {index}", exact=True).select_option(surface)
        self.page.get_by_label(f"Duración o señal para cambiar {index}", exact=True).fill(duration)
        self.page.locator(".planner-stage-editor fieldset").nth(index - 1).locator("textarea").fill(
            notes
        )
