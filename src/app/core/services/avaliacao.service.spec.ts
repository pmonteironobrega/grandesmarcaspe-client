import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AvaliacaoService } from './avaliacao.service';

describe('AvaliacaoService', () => {
  let service: AvaliacaoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AvaliacaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request resumo by cliente id', () => {
    service.getResumo(10).subscribe();
    const req = httpMock.expectOne('/clientes/10/avaliacoes/resumo');
    expect(req.request.method).toBe('GET');
    req.flush({ media: 4.5, total: 2, distribuicao: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } });
  });
});
