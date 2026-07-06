import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AutocompleteOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-autocomplete-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './autocomplete-field.component.html',
  styleUrl: './autocomplete-field.component.scss',
})
export class AutocompleteFieldComponent {
  private elementRef = inject(ElementRef<HTMLElement>);
  private static nextId = 0;
  private readonly instanceId = AutocompleteFieldComponent.nextId++;

  options = input<AutocompleteOption[]>([]);
  placeholder = input('Selecione');
  disabled = input(false);
  inputId = input('');
  selectedValue = input<string | null>(null);
  labelFormat = input<(value: string) => string>((value) => value);

  selectionChange = output<string | null>();

  inputText = signal('');
  isOpen = signal(false);
  highlightedIndex = signal(-1);
  private skipSync = false;

  readonly listboxId = `autocomplete-listbox-${this.instanceId}`;

  filteredOptions = computed(() => {
    const query = this.inputText().trim().toLowerCase();
    const items = this.options();
    if (!query) {
      return items;
    }
    return items.filter((option) => option.label.toLowerCase().includes(query));
  });

  constructor() {
    effect(() => {
      if (this.skipSync) {
        return;
      }

      const value = this.selectedValue();
      const items = this.options();

      if (!value) {
        this.inputText.set('');
        return;
      }

      const option = items.find((item) => item.value === value);
      this.inputText.set(option ? this.labelFormat()(option.label) : '');
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeList();
    }
  }

  onFocus(): void {
    if (this.disabled()) {
      return;
    }
    this.isOpen.set(true);
    this.highlightedIndex.set(this.filteredOptions().length > 0 ? 0 : -1);
  }

  onInput(event: Event): void {
    if (this.disabled()) {
      return;
    }

    const text = (event.target as HTMLInputElement).value;
    this.skipSync = true;
    this.inputText.set(text);
    this.isOpen.set(true);
    this.highlightedIndex.set(this.filteredOptions().length > 0 ? 0 : -1);

    const selected = this.selectedValue();
    if (!text.trim()) {
      if (selected) {
        this.selectionChange.emit(null);
      }
      this.skipSync = false;
      return;
    }

    if (selected) {
      const option = this.options().find((item) => item.value === selected);
      const formatted = option ? this.labelFormat()(option.label) : '';
      if (text !== formatted) {
        this.selectionChange.emit(null);
      }
    }

    this.skipSync = false;
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    const items = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
        }
        if (items.length === 0) {
          this.highlightedIndex.set(-1);
          return;
        }
        this.highlightedIndex.update((index) =>
          index < items.length - 1 ? index + 1 : 0,
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
        }
        if (items.length === 0) {
          this.highlightedIndex.set(-1);
          return;
        }
        this.highlightedIndex.update((index) =>
          index > 0 ? index - 1 : items.length - 1,
        );
        break;

      case 'Enter':
        if (!this.isOpen() || items.length === 0) {
          return;
        }
        event.preventDefault();
        this.selectOption(items[this.highlightedIndex()] ?? items[0]);
        break;

      case 'Escape':
        event.preventDefault();
        this.closeList();
        break;

      default:
        break;
    }
  }

  selectOption(option: AutocompleteOption): void {
    this.skipSync = true;
    this.inputText.set(this.labelFormat()(option.label));
    this.selectionChange.emit(option.value);
    this.closeList();
    this.skipSync = false;
    this.blurInput();
  }

  optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  activeDescendant(): string | null {
    const index = this.highlightedIndex();
    return index >= 0 ? this.optionId(index) : null;
  }

  private closeList(): void {
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
  }

  private blurInput(): void {
    this.elementRef.nativeElement.querySelector('input')?.blur();
  }
}
