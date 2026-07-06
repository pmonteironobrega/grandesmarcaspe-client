import { buildPaginationWindow } from './pagination';

describe('buildPaginationWindow', () => {
  it('returns empty array for a single page', () => {
    expect(buildPaginationWindow(1, 1)).toEqual([]);
  });

  it('returns all pages when total is within the limit', () => {
    expect(buildPaginationWindow(1, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('shows the first window for early pages', () => {
    expect(buildPaginationWindow(1, 35)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('slides the window around the current page', () => {
    expect(buildPaginationWindow(18, 35)).toEqual([
      13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
    ]);
  });

  it('shows the last window near the end', () => {
    expect(buildPaginationWindow(35, 35)).toEqual([
      26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ]);
  });
});
