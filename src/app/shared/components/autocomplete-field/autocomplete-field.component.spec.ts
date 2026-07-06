import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutocompleteFieldComponent } from './autocomplete-field.component';

describe('AutocompleteFieldComponent', () => {
  let component: AutocompleteFieldComponent;
  let fixture: ComponentFixture<AutocompleteFieldComponent>;

  const options = [
    { value: 'academias', label: 'academias' },
    { value: 'restaurantes', label: 'restaurantes' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutocompleteFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AutocompleteFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter options by typed text', () => {
    component.onInput({ target: { value: 'rest' } } as unknown as Event);
    expect(component.filteredOptions().length).toBe(1);
    expect(component.filteredOptions()[0].value).toBe('restaurantes');
  });

  it('should emit selection on option click', () => {
    const emitted: (string | null)[] = [];
    component.selectionChange.subscribe((value) => emitted.push(value));

    component.selectOption(options[0]);
    expect(emitted).toEqual(['academias']);
  });

  it('should clear selection when input is emptied', () => {
    fixture.componentRef.setInput('selectedValue', 'academias');
    fixture.detectChanges();

    const emitted: (string | null)[] = [];
    component.selectionChange.subscribe((value) => emitted.push(value));

    component.onInput({ target: { value: '' } } as unknown as Event);
    expect(emitted).toEqual([null]);
  });

  it('should navigate options with arrow keys and select with Enter', () => {
    component.onFocus();
    expect(component.highlightedIndex()).toBe(0);

    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.highlightedIndex()).toBe(1);

    const emitted: (string | null)[] = [];
    component.selectionChange.subscribe((value) => emitted.push(value));

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual(['restaurantes']);
    expect(component.isOpen()).toBeFalse();
  });

  it('should close list on Escape', () => {
    component.onFocus();
    expect(component.isOpen()).toBeTrue();

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.isOpen()).toBeFalse();
  });

  it('should not open when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.onFocus();
    expect(component.isOpen()).toBeFalse();
  });
});
