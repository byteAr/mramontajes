import { Routes } from '@angular/router';
import { AboutComponent } from './pages/about/about.component';
import { GaleryComponent } from './pages/galery/galery.component';
import { MainComponent } from './shared/main/main.component';

export const routes: Routes = [
  {path: '', component: MainComponent, title: 'MRA MONTAJES'},
  {path: 'about', component: AboutComponent, title: 'SOBRE NOSOTROS'},
  {path: 'gallery', component: GaleryComponent, title: 'GALERIA'},
  {path: '**', redirectTo: ''},
];
