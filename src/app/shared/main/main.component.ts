import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Splide from '@splidejs/splide';
import { AutoScroll } from '@splidejs/splide-extension-auto-scroll';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [CommonModule, RouterLink],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent implements AfterViewInit, OnDestroy {
   @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;
  private splide?: Splide;

  logos = [
    'images/img1.jpg',
    'images/img2.jpg',
    'images/img3.jpg',
    'images/img4.jpg',
    'images/img5.jpg',
    'images/img6.jpg',
  ];

  ngAfterViewInit(): void {
    this.splide = new Splide(this.root.nativeElement, {
      type: 'loop',
      arrows: false,
      pagination: false,
      drag: 'free',
      gap: '0.5rem',
      // Autoscroll continuo y suave:
      autoScroll: {
        speed: 0.4,            // ↓ más bajo = más lento (0.2–0.6 va bien)
        pauseOnHover: true,
        pauseOnFocus: false,
      },
      // Si tus logos tienen anchos muy distintos:
      autoWidth: true,
      // Si prefieres slides fijos, usa perPage en lugar de autoWidth:
      // perPage: 5,
      breakpoints: {
        1024: { gap: '1.25rem' },
        640:  { gap: '0.5rem' },
      },
    });

    this.splide.mount({ AutoScroll });
  }

  ngOnDestroy(): void {
    this.splide?.destroy(true);
  }

}
