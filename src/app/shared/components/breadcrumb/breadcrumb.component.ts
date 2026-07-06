import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { ListRoute } from '../../../core/utils/catalog-url';



export interface BreadcrumbItem {

  page: string;

  router: string | ListRoute;

}



@Component({

  selector: 'app-breadcrumb',

  standalone: true,

  imports: [CommonModule, RouterLink],

  templateUrl: './breadcrumb.component.html',

  styleUrl: './breadcrumb.component.scss',

})

export class BreadcrumbComponent {

  @Input() config: BreadcrumbItem[] = [];

  @Input() sticky = false;



  isListRoute(router: string | ListRoute): router is ListRoute {

    return typeof router === 'object' && router !== null && 'commands' in router;

  }

}

