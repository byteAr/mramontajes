import { Routes } from '@angular/router';
import { AboutComponent } from './pages/about/about.component';
import { GaleryComponent } from './pages/galery/galery.component';
import { MainComponent } from './shared/main/main.component';

export const routes: Routes = [
  {path: '', component: MainComponent, title: 'Home'},
  {path: 'about', component: AboutComponent, title: 'Home'},
  {path: 'gallery', component: GaleryComponent, title: 'Home'},
  {path: '**', redirectTo: ''},
];
