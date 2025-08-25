import {
  Component,
  HostListener,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';


type GaleryImage = string | { src: string; alt?: string };

@Component({
  selector: 'app-galery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galery.component.html',
})
export class GaleryComponent {
  /**
   * TODO: reemplaza estas rutas por las de tu carpeta /public
   * Ej.: public/fotos/1.jpg → '/fotos/1.jpg'
   */
  images: GaleryImage[] = [
    '/images/image1.jpg',
    '/images/image2.jpg',
    '/images/image3.jpg',
    '/images/image4.jpg',
    '/images/image5.jpg',
    '/images/image6.jpg',
    '/images/image7.jpg',
    '/images/image8.jpg',
    '/images/image9.jpg',
    '/images/image10.jpg',
    '/images/image11.jpg',
    '/images/image12.jpg'

  ];

  private index = signal<number>(-1); // -1 = overlay cerrado

  normalizedImages = computed(() =>
    (this.images || []).map((img, i) =>
      typeof img === 'string' ? { src: img, alt: `Imagen ${i + 1}` } : { alt: `Imagen ${i + 1}`, ...img }
    )
  );

  isOpen = computed(() => this.index() >= 0);
  current = computed(() =>
    this.isOpen() ? this.normalizedImages()[this.index()] : undefined
  );

  @ViewChild('overlay', { static: false }) overlayRef?: ElementRef<HTMLDivElement>;

  open(i: number) {
    if (!this.normalizedImages().length) return;
    this.index.set(this.clampIndex(i));
    queueMicrotask(() => this.overlayRef?.nativeElement?.focus());
  }

  close() {
    this.index.set(-1);
  }

  next() {
    if (!this.isOpen()) return;
    const len = this.normalizedImages().length;
    this.index.set((this.index() + 1 + len) % len);
  }

  prev() {
    if (!this.isOpen()) return;
    const len = this.normalizedImages().length;
    this.index.set((this.index() - 1 + len) % len);
  }

  onBackdrop(ev: MouseEvent) {
    if (ev.target === ev.currentTarget) this.close();
  }

  // Teclado: ← → y Escape
  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent) {
    if (!this.isOpen()) return;
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      this.next();
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      this.prev();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      this.close();
    }
  }

  private clampIndex(i: number) {
    const len = this.normalizedImages().length;
    if (len === 0) return -1;
    return Math.max(0, Math.min(i, len - 1));
  }
}
