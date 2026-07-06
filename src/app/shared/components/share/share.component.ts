import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-share',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './share.component.html',
  styleUrl: './share.component.scss',
})
export class ShareComponent {
  @Input() config: unknown;
  redes = [
    { name: 'Facebook', url: 'facebook.com.br', icon: 'facebook.svg' },
    { name: 'Instagram', url: 'instagram.com.br', icon: 'instagram.svg' },
    { name: 'WhatsApp', url: 'whatsapp.com.br', icon: 'whatsapp.svg' },
    { name: 'Twitter', url: 'twitter.com', icon: 'twitter.svg' },
    { name: 'Youtube', url: 'youtube.com.br', icon: 'youtube.svg' },
  ];

  isHide = true;

  showIcons() {
    this.isHide = !this.isHide;

    if (!this.isHide) {
      setTimeout(() => {
        this.isHide = true;
      }, 5000);
    }
  }
}
