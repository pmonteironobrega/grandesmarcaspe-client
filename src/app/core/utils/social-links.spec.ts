import { buildSocialLinks } from './social-links';

describe('buildSocialLinks', () => {
  it('returns empty array when site is missing', () => {
    expect(buildSocialLinks(null)).toEqual([]);
    expect(buildSocialLinks('')).toEqual([]);
  });

  it('detects instagram from site field', () => {
    const links = buildSocialLinks('www.instagram.com/loja');
    expect(links).toEqual([
      {
        name: 'Instagram',
        url: 'https://www.instagram.com/loja',
        icon: 'instagram.svg',
      },
    ]);
  });

  it('uses site icon for generic urls', () => {
    const links = buildSocialLinks('https://minhaempresa.com.br');
    expect(links[0].name).toBe('Site');
    expect(links[0].icon).toBe('site.svg');
  });
});
