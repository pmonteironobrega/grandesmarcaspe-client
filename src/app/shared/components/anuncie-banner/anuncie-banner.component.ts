import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-anuncie',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './anuncie-banner.component.html',
  styleUrl: './anuncie-banner.component.scss',
})
export class AnuncieBannerComponent {}
