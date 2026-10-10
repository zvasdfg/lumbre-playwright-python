import pytest
from playwright.sync_api import expect

from projects.lumbre.components.ingredient_lab import IngredientLab

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.navigation,
    pytest.mark.accessibility,
    pytest.mark.regression,
]


@pytest.mark.case("UI-102", "Loaded form controls have names; image alternatives and IDs are valid")
def test_accessible_dom_contract(portal):
    page = portal
    IngredientLab(page).open()
    expect(page.get_by_test_id("ingredient-card").first).to_be_attached()
    issues = page.evaluate(r"""() => {
      const issues = [], ids = new Set();
      for (const node of document.querySelectorAll('[id]')) {
        if (ids.has(node.id)) issues.push('Duplicate ID: ' + node.id);
        ids.add(node.id);
      }
      for (const image of document.querySelectorAll('img')) {
        if (!image.hasAttribute('alt')) issues.push('Missing alt: ' + image.getAttribute('src'));
      }
      for (const node of document.querySelectorAll('input:not([type=hidden]),select,textarea')) {
        const labelled = (node.getAttribute('aria-labelledby') || '').split(/\s+/)
          .filter(Boolean).map(id => document.getElementById(id)?.textContent || '').join('');
        const labels = [...(node.labels || [])].map(e => e.textContent).join('');
        if (!(node.getAttribute('aria-label') || labelled || labels).trim())
          issues.push('Unnamed control: ' + node.outerHTML);
      }
      for (const node of document.querySelectorAll('[aria-labelledby],[aria-describedby]')) {
        for (const attr of ['aria-labelledby', 'aria-describedby']) {
          for (const id of (node.getAttribute(attr) || '').split(/\s+/).filter(Boolean))
            if (!document.getElementById(id)) issues.push(attr + ' missing ID: ' + id);
        }
      }
      return issues;
    }""")
    assert not issues, issues
    expect(page.locator("h1")).to_have_count(1)
