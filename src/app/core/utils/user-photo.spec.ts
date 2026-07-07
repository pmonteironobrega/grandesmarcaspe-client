import { resolveUserPhotoUrl } from './user-photo';

describe('resolveUserPhotoUrl', () => {
  it('should return null for empty path', () => {
    expect(resolveUserPhotoUrl(null)).toBeNull();
  });

  it('should prefix relative paths with assets base url', () => {
    expect(resolveUserPhotoUrl('usuarios/1/avatar.jpg')).toBe(
      'http://localhost:3000/usuarios/1/avatar.jpg',
    );
  });
});
