import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  while (!auth.listo()) {
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  if (auth.autenticado()) return true;

  return router.createUrlTree(['/admin/login'], {
    queryParams: { returnUrl: estado.url },
  });
};