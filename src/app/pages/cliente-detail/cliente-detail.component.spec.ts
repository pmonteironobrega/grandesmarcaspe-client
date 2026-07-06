import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';

import { provideHttpClientTesting } from '@angular/common/http/testing';

import { provideRouter } from '@angular/router';

import { ClienteDetailComponent } from './cliente-detail.component';



describe('ClienteDetailComponent', () => {

  let component: ClienteDetailComponent;

  let fixture: ComponentFixture<ClienteDetailComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [ClienteDetailComponent],

      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],

    }).compileComponents();



    fixture = TestBed.createComponent(ClienteDetailComponent);

    component = fixture.componentInstance;

    fixture.detectChanges();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});


