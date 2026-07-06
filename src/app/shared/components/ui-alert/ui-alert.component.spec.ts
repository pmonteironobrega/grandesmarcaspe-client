import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { UiAlertComponent } from './ui-alert.component';

describe('UiAlertComponent', () => {
  let fixture: ComponentFixture<UiAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiAlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiAlertComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit dismissed after autoDismissMs', fakeAsync(() => {
    const dismissedSpy = jasmine.createSpy('dismissed');
    fixture.componentRef.setInput('autoDismissMs', 3000);
    fixture.componentInstance.dismissed.subscribe(dismissedSpy);
    fixture.detectChanges();

    tick(2999);
    expect(dismissedSpy).not.toHaveBeenCalled();

    tick(1);
    expect(dismissedSpy).toHaveBeenCalledTimes(1);
  }));

  it('should not auto dismiss when autoDismissMs is 0', fakeAsync(() => {
    const dismissedSpy = jasmine.createSpy('dismissed');
    fixture.componentRef.setInput('autoDismissMs', 0);
    fixture.componentInstance.dismissed.subscribe(dismissedSpy);
    fixture.detectChanges();

    tick(10000);
    expect(dismissedSpy).not.toHaveBeenCalled();
  }));
});
