import { PlatformLocation } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ADSENSE_SLOTS } from '../../../core/constants/adsense';
import { environment } from '../../../../environments/environment';
import { AdSlotComponent } from './ad-slot.component';

describe('AdSlotComponent', () => {
  const previousClient = environment.adsenseClient;
  const previousSite = environment.siteUrl;

  afterEach(() => {
    environment.adsenseClient = previousClient;
    environment.siteUrl = previousSite;
  });

  function setup(slot: string, hostname: string): ComponentFixture<AdSlotComponent> {
    TestBed.configureTestingModule({
      imports: [AdSlotComponent],
      providers: [{ provide: PlatformLocation, useValue: { hostname } }],
    });
    const fixture = TestBed.createComponent(AdSlotComponent);
    fixture.componentRef.setInput('slot', slot);
    fixture.componentRef.setInput('width', 320);
    fixture.componentRef.setInput('height', 100);
    fixture.detectChanges();
    return fixture;
  }

  it('should reserve the fixed unit height on the production host without an automatic ad', () => {
    environment.adsenseClient = 'ca-pub-test';
    environment.siteUrl = 'https://www.grandesmarcaspe.com.br';

    const fixture = setup(ADSENSE_SLOTS.categorias, 'www.grandesmarcaspe.com.br');
    const box = fixture.nativeElement.querySelector('.ad-slot') as HTMLElement | null;

    const ins = fixture.nativeElement.querySelector('ins.adsbygoogle') as HTMLElement | null;

    expect(box).not.toBeNull();
    expect(box?.style.minHeight).toBe('100px');
    expect(ins).not.toBeNull();
    expect(ins?.style.width).toBe('320px');
    expect(ins?.style.height).toBe('100px');
    expect(ins?.getAttribute('data-ad-format')).toBeNull();
  });

  it('should leave the layout untouched when ads are disabled', () => {
    environment.adsenseClient = '';
    environment.siteUrl = 'http://localhost:4200';

    const fixture = setup(ADSENSE_SLOTS.categorias, 'localhost');

    expect(fixture.nativeElement.querySelector('.ad-slot')).toBeNull();
  });
});
