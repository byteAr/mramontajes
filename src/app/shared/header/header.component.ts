import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  imageSrc = 'file.svg';   // TU SVG de fondo
  anchorX = 0;                           // se setea al calibrar
  anchorY = 0;

  private naturalW = 0;
  private naturalH = 0;

  @ViewChild('hero', { static: true }) heroRef!: ElementRef<HTMLElement>;

  ngOnInit() {
    const img = new Image();
    img.onload = () => {
      this.naturalW = img.naturalWidth || 0;
      this.naturalH = img.naturalHeight || 0;
      if (!this.naturalW || !this.naturalH) {
        console.warn('Tu SVG debe tener viewBox para medir tamaño real.');
      }
    };
    img.src = this.imageSrc;
  }

  calibrate(evt: MouseEvent) {
    if (!this.naturalW || !this.naturalH) return;

    const el = this.heroRef.nativeElement;
    const rect = el.getBoundingClientRect();

    // Coordenadas del click dentro del contenedor
    const cx = evt.clientX - rect.left;
    const cy = evt.clientY - rect.top;

    const cw = rect.width;
    const ch = rect.height;

    // Invertimos object-fit: cover
    const scale = Math.max(cw / this.naturalW, ch / this.naturalH);
    const dispW = this.naturalW * scale;
    const dispH = this.naturalH * scale;
    const offX  = (cw - dispW) / 2;
    const offY  = (ch - dispH) / 2;

    this.anchorX = (cx - offX) / scale;
    this.anchorY = (cy - offY) / scale;

    console.log('anchorX:', Math.round(this.anchorX), 'anchorY:', Math.round(this.anchorY));
    // 👆 Copia esos valores en tu template si quieres fijarlos y quita el (click).
  }

}
