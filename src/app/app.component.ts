import { Component, HostListener, OnDestroy, OnInit, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  // ----- Parallax -----
  private rafId = 0;
  private targetX = 0;
  private targetY = 0;

  // ----- Contador -----
  countdown = '';
  private timerId: number | null = null;
  private eventAt = new Date('2025-10-31T12:00:00');

  // ----- Audio / botón flotante -----
  private audioEl: HTMLAudioElement | null = null;
  private toggleBtn: HTMLButtonElement | null = null;

  ngOnInit(): void {
    this.updateCountdown();
    this.timerId = window.setInterval(() => this.updateCountdown(), 1000);
  }

  ngAfterViewInit(): void {
    // Referencias de DOM
    this.audioEl = document.getElementById('bgMusic') as HTMLAudioElement | null;
    this.toggleBtn = document.getElementById('audioToggle') as HTMLButtonElement | null;

    if (!this.audioEl) return;

    // 🔊 Reproducir tras primera interacción (reglas de autoplay)
    const playMusic = () => {
      this.audioEl!.play().catch(() => {});
      document.removeEventListener('click', playMusic);
      document.removeEventListener('touchstart', playMusic);
      this.updateAudioToggleUI(true);
    };
    document.addEventListener('click', playMusic);
    document.addEventListener('touchstart', playMusic);

    // 🟣 Lógica del botón flotante
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        if (!this.audioEl) return;
        if (this.audioEl.paused) {
          this.audioEl.play().catch(() => {});
          this.updateAudioToggleUI(true);
        } else {
          this.audioEl.pause();
          this.updateAudioToggleUI(false);
        }
      });

      // Estado inicial (si el navegador bloquea, se actualizará tras 1er click)
      this.updateAudioToggleUI(!this.audioEl.paused);
    }
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // ---- UI helper para el botón de audio ----
  private updateAudioToggleUI(isPlaying: boolean) {
    if (!this.toggleBtn) return;
    this.toggleBtn.setAttribute('aria-pressed', String(!isPlaying));
    this.toggleBtn.title = isPlaying ? 'Música: encendida' : 'Música: silenciada';
    this.toggleBtn.setAttribute('aria-label', isPlaying ? 'Silenciar música' : 'Activar música');

    const onIcon = this.toggleBtn.querySelector('.icon-sound-on') as HTMLElement | null;
    const offIcon = this.toggleBtn.querySelector('.icon-sound-off') as HTMLElement | null;
    if (onIcon && offIcon) {
      onIcon.style.display = isPlaying ? '' : 'none';
      offIcon.style.display = isPlaying ? 'none' : '';
    }
  }

  // ---- Countdown ----
  private updateCountdown() {
    const now = Date.now();
    const diff = this.eventAt.getTime() - now;

    if (diff <= 0) {
      this.countdown = '¡Es hoy! 🎉';
      if (this.timerId !== null) { clearInterval(this.timerId); this.timerId = null; }
      return;
    }

    const sec = Math.floor(diff / 1000) % 60;
    const min = Math.floor(diff / (1000 * 60)) % 60;
    const hrs = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const pad = (n: number) => String(n).padStart(2, '0');
    this.countdown = `${days}d : ${pad(hrs)}h : ${pad(min)}m : ${pad(sec)}s`;

    // Marca visual si faltan < 24h
    const oneDay = 1000 * 60 * 60 * 24;
    const countdownEl = document.querySelector('.countdown');
    if (countdownEl) {
      if (diff < oneDay) countdownEl.classList.add('urgent');
      else countdownEl.classList.remove('urgent');
    }
  }

  // ---- Parallax ----
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    this.targetX = e.clientX / w - 0.5;
    this.targetY = e.clientY / h - 0.5;
    this.scheduleUpdate();
  }

  @HostListener('window:deviceorientation', ['$event'])
  onTilt(ev: DeviceOrientationEvent) {
    const gx = (ev.gamma ?? 0) / 45;
    const gy = (ev.beta ?? 0) / 45;
    this.targetX = Math.max(-1, Math.min(1, gx));
    this.targetY = Math.max(-1, Math.min(1, gy));
    this.scheduleUpdate();
  }

  private scheduleUpdate() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--px', this.targetX.toFixed(4));
      document.documentElement.style.setProperty('--py', this.targetY.toFixed(4));
      this.rafId = 0;
    });
  }
}
