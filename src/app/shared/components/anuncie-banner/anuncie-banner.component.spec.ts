import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnuncieBannerComponent } from './anuncie-banner.component';

describe('AnuncieBannerComponent', () => {
  let component: AnuncieBannerComponent;
  let fixture: ComponentFixture<AnuncieBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnuncieBannerComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AnuncieBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
