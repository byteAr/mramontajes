import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; hue: number;
  prevX: number; prevY: number;
}

@Component({
  selector: 'app-weld-sparks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weld-sparks.component.html',
  styleUrls: ['./weld-sparks.component.css'],
  host: { class: 'weld-host' },
})
export class WeldSparksComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cvs', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  /** Origen de la soldadura en % del contenedor */
  @Input() xPercent = 65;
  @Input() yPercent = 65;

  /** 0.5 = menos chispas | 1 = normal | 2+ = muchas */
  @Input() intensity = 1;

  @Input() imageSrc = '';   // misma imagen que muestras de fondo
  @Input() anchorX = 0;     // X en píxeles del archivo original
  @Input() anchorY = 0;     // Y en píxeles del archivo original
  @Input() objectPosX = 0.5; // 0 = left, 0.5 = center, 1 = right
  @Input() objectPosY = 0.5;

  private naturalW = 0;     // tamaño real del archivo
  private naturalH = 0;

  private ctx!: CanvasRenderingContext2D;
  private rafId = 0;
  private ro?: ResizeObserver;

  private sparks: Spark[] = [];
  private lastT = performance.now();
  private nextSpawnAt = this.lastT;
  private burstLeft = 0;
  private destroyed = false;

  // Física / look
  private gravity = 2200;     // px/s^2
  private drag = 0.985;       // 0.97–0.995 (rozamiento)
  private fadePow = 2.10;     // 1 = lineal (mayor = se apaga más rápido al final)
  private speedMin = 520;     // inicio violento
  private speedMax = 1100;
  private lifeMin = 400;      // ms (vida corta)
  private lifeMax = 750;
  private tail = 12;          // largo de cola (px)

  // Aleatoriedad (dirección/tiempo)
  private thetaSpread = 0.9;      // dispersión alrededor de π (izquierda)
  private fullRandomChance = 0.35; // prob. de 360° (sin sesgo)
  private upBias = 0.12;          // leve sesgo hacia arriba

  // Emisión esporádica (Poisson + ráfagas)
  private baseIntervalMin = 90;
  private baseIntervalMax = 280;
  private pauseChance = 0.35;
  private pauseMin = 450;
  private pauseMax = 1200;
  private burstChance = 0.35;
  private burstCountMin = 1;
  private burstCountMax = 3;
  private burstStepMin = 16;   // ms entre chispas en ráfaga
  private burstStepMax = 35;

  // 🔵✨ Flare (destello) solo al nacer una chispa
  private lastFlash = 0;       // ms del último spawn
  private FLASH_MS = 10;      // duración del destello

  constructor(private zone: NgZone, private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const cvs = this.canvasRef.nativeElement;
    const ctx = cvs.getContext('2d', { alpha: true })!;
    this.ctx = ctx;
    this.ctx.globalCompositeOperation = 'lighter';

    this.ro = new ResizeObserver(() => this.resizeCanvas());
    this.ro.observe(this.host.nativeElement);
    this.resizeCanvas();

    this.zone.runOutsideAngular(() => this.loop());
    this.loadImageMeta();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.ro?.disconnect();
  }

  private resizeCanvas(): void {
    const cvs = this.canvasRef.nativeElement;
    const { clientWidth: w, clientHeight: h } = this.host.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.max(1, Math.floor(w * dpr));
    cvs.height = Math.max(1, Math.floor(h * dpr));
    cvs.style.width = w + 'px';
    cvs.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private loop = () => {
    if (this.destroyed) return;
    this.rafId = requestAnimationFrame(this.loop);

    const t = performance.now();
    const dt = Math.min(64, t - this.lastT) / 1000;
    this.lastT = t;

    this.spawnScheduler(t);
    this.step(dt);
    this.draw();
  };

  private spawnScheduler(now: number): void {
    if (now < this.nextSpawnAt) return;

    const amount = this.intensity;
    const maxSparks = Math.floor(70 * amount);

    const spawnOne = () => {
      if (this.sparks.length >= maxSparks) return;

      // Violento y corto
      const speed = this.rand(this.speedMin, this.speedMax) * this.lerp(0.9, 1.2, Math.random());

      // Dirección aleatoria: mayor prob. izquierda (π), a veces 360°
      let theta: number;
      if (Math.random() < this.fullRandomChance) {
        theta = this.rand(0, Math.PI * 2);
      } else {
        theta = Math.PI + this.rand(-this.thetaSpread, this.thetaSpread);
      }

      const vx = Math.cos(theta) * speed;
      const vy = Math.sin(theta) * (speed * 0.18) - this.rand(0, this.upBias * speed);

      const { x, y } = this.originPx();

      const p: Spark = {
        x, y, vx, vy,
        life: this.rand(this.lifeMin, this.lifeMax),
        maxLife: 0,
        size: this.rand(1.4, 2.6),
        hue: this.rand(26, 42),
        prevX: x, prevY: y,
      };
      p.maxLife = p.life;
      this.sparks.push(p);

      // 🔵✨ dispara el destello
      this.lastFlash = performance.now();
    };

    if (this.burstLeft > 0) {
      spawnOne();
      this.burstLeft--;
      this.nextSpawnAt = now + this.rand(this.burstStepMin, this.burstStepMax) / this.intensity;
      return;
    }

    if (Math.random() < this.burstChance * this.intensity) {
      this.burstLeft = Math.floor(this.rand(this.burstCountMin, this.burstCountMax) * this.intensity);
      spawnOne();
      this.burstLeft--;
      this.nextSpawnAt = now + this.rand(this.burstStepMin, this.burstStepMax) / this.intensity;
      return;
    }

    if (Math.random() < this.pauseChance) {
      this.nextSpawnAt = now + this.rand(this.pauseMin, this.pauseMax);
      return;
    }

    spawnOne();
    this.nextSpawnAt = now + this.rand(this.baseIntervalMin, this.baseIntervalMax) / this.intensity;
  }

  private loadImageMeta() {
  if (!this.imageSrc) return;
  const img = new Image();
  img.onload = () => {
    this.naturalW = img.naturalWidth;
    this.naturalH = img.naturalHeight;
  };
  img.src = this.imageSrc;
}


  private step(dt: number): void {
    const dragFactor = Math.pow(this.drag, dt * 60);

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];

      p.prevX = p.x;
      p.prevY = p.y;

      // turbulencia ligera: trayectorias no rectas
      p.vx += this.rand(-30, 30);
      p.vy += this.rand(-40, 20);

      // rozamiento + gravedad
      p.vx *= dragFactor;
      p.vy = p.vy * dragFactor + this.gravity * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.life -= dt * 1000;

      if (
        p.life <= 0 ||
        p.x < -50 ||
        p.x > this.host.nativeElement.clientWidth + 50 ||
        p.y > this.host.nativeElement.clientHeight + 50
      ) {
        this.sparks.splice(i, 1);
      }
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.host.nativeElement.clientWidth;
    const h = this.host.nativeElement.clientHeight;

    // limpiar frame
    ctx.clearRect(0, 0, w, h);

    // 🔵✨ flare SOLO si hubo emisión hace muy poco
    const now = performance.now();
    const since = now - this.lastFlash;
    if (since < this.FLASH_MS) {
      const { x: ox, y: oy } = this.originPx();
      const k = 1 - (since / this.FLASH_MS);
      const pulse = 1 + Math.sin(now * 0.025) * 0.04;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.85 * k;
      const grd = ctx.createRadialGradient(ox + 8, oy + 4, 0, ox, oy, 60 * pulse);
      grd.addColorStop(0, 'rgba(255,255,255,0.95)');
      grd.addColorStop(0.15, 'rgba(180,235,255,0.95)');
      grd.addColorStop(0.35, 'rgba(45,183,255,0.75)');
      grd.addColorStop(1, 'rgba(45,183,255,0.0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(ox, oy, 60 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // chispas
    for (const p of this.sparks) {
      const lifeK = Math.max(0, p.life / p.maxLife);
      const alpha = Math.pow(lifeK, this.fadePow);

      // segmento de cola
      const dx = p.x - p.prevX;
      const dy = p.y - p.prevY;
      const len = Math.hypot(dx, dy) || 1;
      const ux = (dx / len) * this.tail;
      const uy = (dy / len) * this.tail;

      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.strokeStyle = `hsla(${p.hue}, 90%, 58%, ${alpha})`;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - ux, p.y - uy);
      ctx.stroke();

      ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private originPx() {
  const host = this.host.nativeElement;
  const cw = host.clientWidth;
  const ch = host.clientHeight;

  if (!this.naturalW || !this.naturalH) {
    return { x: (this.xPercent / 100) * cw, y: (this.yPercent / 100) * ch };
  }

  const scale = Math.max(cw / this.naturalW, ch / this.naturalH);
  const dispW = this.naturalW * scale;
  const dispH = this.naturalH * scale;

  // desplazamiento según object-position
  const offX = (cw - dispW) * this.objectPosX;
  const offY = (ch - dispH) * this.objectPosY;

  const x = offX + this.anchorX * scale;
  const y = offY + this.anchorY * scale;
  return { x, y };
}



  // utils
  private rand(min: number, max: number) { return Math.random() * (max - min) + min; }
  private lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
}
