import { describe, expect, it } from 'vitest';
import { fotoProdukSitus } from '../../src/utils/website';

describe('Website product photos', () => {
  it('uses the legacy single image when no gallery has been saved yet', () => {
    expect(fotoProdukSitus({ imageUrl: '/produk/utama.png' })).toEqual(['/produk/utama.png']);
  });

  it('uses ordered gallery images and allows an explicit empty gallery to clear legacy photos', () => {
    expect(
      fotoProdukSitus({
        imageUrl: '/produk/lama.png',
        imageUrls: [' /produk/depan.png ', '', '/produk/samping.png']
      })
    ).toEqual(['/produk/depan.png', '/produk/samping.png']);
    expect(fotoProdukSitus({ imageUrl: '/produk/lama.png', imageUrls: [] })).toEqual([]);
  });
});
