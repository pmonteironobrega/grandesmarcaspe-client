import { buildHomeSeo, HOME_DESCRIPTION, HOME_TITLE } from './home-seo';

describe('buildHomeSeo', () => {
  const seo = buildHomeSeo('https://www.example.com.br/');

  it('should use the home canonical without double slash', () => {
    expect(seo.canonicalUrl).toBe('https://www.example.com.br/');
  });

  it('should keep title and description within SERP limits', () => {
    expect(HOME_TITLE.length).toBeLessThanOrEqual(70);
    expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it('should describe the site and its publisher as linked JSON-LD', () => {
    const [website, organization] = seo.jsonLd as Record<string, unknown>[];

    expect(website['@type']).toBe('WebSite');
    expect(website['publisher']).toEqual({ '@id': organization['@id'] });
    expect(organization['@type']).toBe('Organization');
    expect(organization['logo']).toBe('https://www.example.com.br/apple-touch-icon.png');
  });
});
