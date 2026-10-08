// Purchase and live availability are managed by Tiendanube, not the static portal.
export const storeUrl = "https://lumbre16.mitiendanube.com/productos/";
const productUrls: Record<string, string> = {
  "LMB-F-001": "lmb-f-001-sazonador-multiuso-150-g-1i9us/",
  "LMB-F-002": "lmb-f-002-sazonador-para-carne-de-res-150-g-1l5mw/",
  "LMB-F-003": "lmb-f-003-sazonador-para-carne-de-cerdo-150-g-c2wqk/",
  "LMB-F-004": "lmb-f-004-sazonador-para-carne-de-pollo-150-g-4mkqi/",
};
export function productStoreUrl(productCode: string): string {
  return storeUrl + (productUrls[productCode] ?? "");
}
