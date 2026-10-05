import { PlatformLocation } from '@angular/common';
import { FetchBackend, HttpEvent, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Sends same-origin API calls made during SSR to the internal API address.
 * The rewrite happens in the backend, after the transfer cache has keyed the request, so
 * server and browser share the same relative cache key and hydration does not refetch.
 */
export function toInternalApiUrl(url: string, selfOrigin: string, apiUrl: string): string {
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `${apiUrl}${url}`;
  }
  if (url.startsWith(`${selfOrigin}/`)) {
    return `${apiUrl}${url.slice(selfOrigin.length)}`;
  }
  return url;
}

@Injectable()
export class ServerApiBackend extends FetchBackend {
  private readonly location = inject(PlatformLocation);

  override handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const { protocol, hostname, port } = this.location;
    const selfOrigin = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    return super.handle(
      request.clone({ url: toInternalApiUrl(request.url, selfOrigin, environment.apiUrl) }),
    );
  }
}
