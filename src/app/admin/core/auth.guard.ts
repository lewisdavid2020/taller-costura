import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  while (!auth.listo()) {
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  if (auth.autenticado() && auth.esAdmin()) return true;

  if (auth.autenticado() && !auth.esAdmin()) {
    // El rol puede cargar async tras un cambio de sesión; espera breve.
    for (let i = 0; i < 40; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (auth.esAdmin()) return true;
      if (!auth.autenticado()) break;
    }
    await auth.cerrarSesion();
  }

  return router.createUrlTree(['/admin/login'], {
    queryParams: { returnUrl: estado.url },
  });
};