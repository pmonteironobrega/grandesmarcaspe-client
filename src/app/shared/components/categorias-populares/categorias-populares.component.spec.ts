import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CategoriasPopularesComponent } from './categorias-populares.component';

describe('CategoriasPopularesComponent', () => {
  let component: CategoriasPopularesComponent;
  let fixture: ComponentFixture<CategoriasPopularesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasPopularesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriasPopularesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
