import { PlatformLocation } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ADSENSE_SLOTS, DETALHES_TOPO_RESERVED_HEIGHT } from '../../../core/constants/adsense';
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
    fixture.detectChanges();
    return fixture;
  }

  it('should reserve the top slot height in the first render on the production host', () => {
    environment.adsenseClient = 'ca-pub-test';
    environment.siteUrl = 'https://www.grandesmarcaspe.com.br';

    const fixture = setup(ADSENSE_SLOTS.detalhesTopo, 'www.grandesmarcaspe.com.br');
    const box = fixture.nativeElement.querySelector('.ad-slot') as HTMLElement | null;

    expect(box).not.toBeNull();
    expect(box?.style.minHeight).toBe(`${DETALHES_TOPO_RESERVED_HEIGHT}px`);
    expect(fixture.nativeElement.querySelector('ins.adsbygoogle')).toBeNull();
  });

  it('should leave the layout untouched when ads are disabled', () => {
    environment.adsenseClient = '';
    environment.siteUrl = 'http://localhost:4200';

    const fixture = setup(ADSENSE_SLOTS.detalhesTopo, 'localhost');

    expect(fixture.nativeElement.querySelector('.ad-slot')).toBeNull();
  });
});
