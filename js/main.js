(function () {
  'use strict';

  // ---- Wedding details (single source of truth) ----
  var MUHURTHAM = new Date('2026-11-15T10:15:00+05:30');   // 10:15 AM IST
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var body = document.body;
  var envelope = document.getElementById('envelope');
  var openBtn = document.getElementById('openBtn');
  var toggle = document.getElementById('musicToggle');

  /* ---------- Opening ---------- */
  var opened = false;
  function openInvitation() {
    if (opened) return;
    opened = true;

    Music.start();                         // inside the tap = allowed by iOS / Android / desktop

    envelope.classList.add('opening');
    setTimeout(function () {
      envelope.classList.add('done');
      body.classList.remove('locked');
      body.classList.add('opened');
      toggle.classList.remove('hidden');
      window.scrollTo(0, 0);
      startPetals();
    }, reduceMotion ? 100 : 2000);
    setTimeout(function () { envelope.style.display = 'none'; }, reduceMotion ? 400 : 3200);
  }
  openBtn.addEventListener('click', openInvitation);
  envelope.addEventListener('click', openInvitation);

  /* ---------- Music toggle ---------- */
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    Music.toggle();
  });
  Music.onChange(function (muted) {
    toggle.classList.toggle('muted', muted);
    toggle.setAttribute('aria-pressed', String(muted));
  });

  /* ---------- Falling petals ---------- */
  function startPetals() {
    if (reduceMotion) return;
    var box = document.getElementById('petals');
    var count = window.innerWidth < 600 ? 14 : 24;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('span');
      p.className = 'petal' + (Math.random() < 0.3 ? ' r' : '');
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--dx', (Math.random() * 140 - 70) + 'px');
      p.style.animationDuration = (9 + Math.random() * 9) + 's';
      p.style.animationDelay = (-Math.random() * 14) + 's';
      var s = 0.6 + Math.random() * 0.9;
      p.style.width = 12 * s + 'px'; p.style.height = 16 * s + 'px';
      box.appendChild(p);
    }
  }

  /* ---------- Scroll reveal ---------- */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Subtle hero parallax ---------- */
  var mandala = document.querySelector('.hero-inner');
  if (!reduceMotion && mandala) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        mandala.style.transform = 'translateY(' + (y * 0.18) + 'px)';
        mandala.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.9)));
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Calendar (November 2026) ---------- */
  var grid = document.getElementById('calGrid');
  if (grid) {
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d) {
      var h = document.createElement('div'); h.className = 'dh'; h.textContent = d; grid.appendChild(h);
    });
    var first = new Date(2026, 10, 1).getDay();      // 1 Nov 2026 = Sunday
    for (var b = 0; b < first; b++) grid.appendChild(document.createElement('div'));
    for (var day = 1; day <= 30; day++) {
      var c = document.createElement('div');
      c.className = 'd' + (day === 15 ? ' hl' : '');
      c.textContent = day;
      if (day === 15) c.setAttribute('aria-label', '15 November – wedding day');
      grid.appendChild(c);
    }
  }

  /* ---------- Add to calendar (.ics) ---------- */
  var addCal = document.getElementById('addCal');
  if (addCal) addCal.addEventListener('click', function () {
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sri Harsha and Divya Sudha//Wedding//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:wedding-sriharsha-divyasudha-20261115@invitation',
      'DTSTAMP:20261102T000000Z',
      'DTSTART:20261115T044500Z',              // 10:15 AM IST
      'DTEND:20261115T064500Z',
      'SUMMARY:Wedding of Sri Harsha & Divya Sudha (Muhurtham 10:15 AM)',
      'LOCATION:Sri Mahalakshmi Function Hall\\, Allagadda',
      'DESCRIPTION:With the blessings of our families\\, we invite you to the wedding of Sri Harsha & Divya Sudha.',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Wedding tomorrow', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'Sri-Harsha-and-Divya-Sudha-Wedding.ics';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  });

  /* ---------- Countdown ---------- */
  var dEl = document.getElementById('cdD'), hEl = document.getElementById('cdH'),
      mEl = document.getElementById('cdM'), sEl = document.getElementById('cdS'),
      doneEl = document.getElementById('cdDone'), cdBox = document.getElementById('countdown');
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function tick() {
    var diff = MUHURTHAM.getTime() - Date.now();
    if (diff <= 0) {
      dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = '00';
      if (doneEl) doneEl.hidden = false;
      return false;
    }
    var s = Math.floor(diff / 1000);
    dEl.textContent = pad(Math.floor(s / 86400));
    hEl.textContent = pad(Math.floor(s % 86400 / 3600));
    mEl.textContent = pad(Math.floor(s % 3600 / 60));
    sEl.textContent = pad(s % 60);
    return true;
  }
  if (tick()) setInterval(tick, 1000);
})();
