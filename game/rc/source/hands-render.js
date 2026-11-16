/* Read-only Canvas view for the First Encounter hands practice room. */
var HandsView = (() => {
  const rad = Math.PI / 180;
  const height = 720;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const mix = (a, b, f) => a + (b - a) * f;
  const ease = f => f * f * (3 - 2 * f);
  const p3 = (x, y, z) => ({x, y, z});
  const aim = yaw => ({x: Math.sin(yaw * rad), y: -Math.cos(yaw * rad)});
  const rgb = (hex, strength) => {
    const v = parseInt(hex.slice(1), 16);
    return 'rgb(' + [(v >> 16) & 255, (v >> 8) & 255, v & 255]
      .map(n => Math.round(clamp(n * strength, 0, 255))).join(',') + ')';
  };

  function create(canvas, source, art) {
    const ctx = canvas.getContext('2d', {alpha: false});
    const images = {};
    const failures = [];
    const ready = Promise.all(Object.keys(art.assets).map(name => new Promise(resolve => {
      const image = new Image();
      image.onload = () => { images[name] = image; resolve(); };
      image.onerror = () => { failures.push(name); resolve(); };
      image.src = source[name] || 'data:,';
    })));
    const texture = document.createElement('canvas');
    texture.width = texture.height = 112;
    const texCtx = texture.getContext('2d');
    const grain = texCtx.createImageData(112, 112);
    let seed = 2121;
    for (let i = 0; i < grain.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = (seed >>> 24) % 2 ? 0 : 255;
      grain.data[i + 3] = (seed >>> 16) % 18;
    }
    texCtx.putImageData(grain, 0, 0);
    const noise = ctx.createPattern(texture, 'repeat');
    let width = 1280;
    let focal = 548;
    let camera;
    let report = {};
    let offset = {x: 0, y: 0};

    function viewPoint(p) {
      const dx = p.x - camera.x, dy = p.y - camera.y, dz = p.z - camera.z;
      const forward = dx * camera.fx + dy * camera.fy;
      return {
        x: dx * camera.rx + dy * camera.ry,
        y: dz * camera.cosPitch - forward * camera.sinPitch,
        z: forward * camera.cosPitch + dz * camera.sinPitch,
      };
    }

    function projectView(p) {
      return {
        x: width / 2 + offset.x + p.x * focal / p.z,
        y: height * .50 + offset.y - p.y * focal / p.z, d: p.z,
      };
    }

    function project(p) {
      const v = viewPoint(p);
      return v.z > 0.07 ? projectView(v) : null;
    }

    function clipView(vertices) {
      const clipped = [];
      const minimum = 0.07;
      let previous = vertices[vertices.length - 1];
      for (const current of vertices) {
        if ((previous.z >= minimum) !== (current.z >= minimum)) {
          const f = (minimum - previous.z) / (current.z - previous.z);
          clipped.push(p3(mix(previous.x, current.x, f), mix(previous.y, current.y, f), minimum));
        }
        if (current.z >= minimum) clipped.push(current);
        previous = current;
      }
      return clipped.map(projectView);
    }

    function polygon(points, fill, stroke, lineWidth = 1) {
      if (points.length < 3 || points.some(p => !p)) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
    }

    function shape(points, fill, stroke, thickness) {
      polygon(clipView(points.map(viewPoint)), fill, stroke, thickness);
    }

    function line2(a, b, color, thickness = 1) {
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.stroke();
    }

    function line3(a, b, color, thickness = 1) {
      const va = viewPoint(a), vb = viewPoint(b);
      if (va.z < 0.07 && vb.z < 0.07) return;
      const trim = (a, b) => {
        const f = (0.07 - a.z) / (b.z - a.z);
        return p3(mix(a.x, b.x, f), mix(a.y, b.y, f), .07);
      };
      line2(projectView(va.z < .07 ? trim(va, vb) : va),
        projectView(vb.z < .07 ? trim(vb, va) : vb), color, thickness);
    }

    function ellipse2(x, y, rx, ry, fill, angle = 0, stroke = null) {
      if (rx < .2 || ry < .2) return;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }

    function ground(x0, y0, x1, y1, fill, z = 0) {
      shape([p3(x0, y0, z), p3(x1, y0, z), p3(x1, y1, z), p3(x0, y1, z)], fill);
    }

    function groundEllipse(x, y, rx, ry, z, color) {
      const perimeter = Array.from({length: 28}, (_, i) => {
        const angle = i / 28 * Math.PI * 2;
        return p3(x + Math.cos(angle) * rx, y + Math.sin(angle) * ry, z);
      });
      shape(perimeter, color);
    }

    function wall(point, index) {
      const panel = (u, z, w, h, color, stroke) => shape(
        [point(u, z), point(u + w, z), point(u + w, z + h), point(u, z + h)], color, stroke);
      const seam = (u0, z0, u1, z1, color, size) => line3(point(u0, z0), point(u1, z1), color, size);
      const shading = ctx.createLinearGradient(0, 0, 0, height);
      shading.addColorStop(0, '#162329');
      shading.addColorStop(.49, ['#2d393c', '#29353a', '#343a39', '#29353a'][index]);
      shading.addColorStop(1, '#73746b');
      panel(-6, 0, 12, 4, shading);
      panel(-6, 0, 12, .12, '#111a1b');
      panel(-6, .12, 12, .96, '#404645');
      panel(-6, 1.08, 12, .032, '#768078');
      panel(-6, 1.14, 12, .035, '#273336');

      for (let u = -5; u <= 5; u += 2.5) {
        panel(u, 0, .045, 3.8, '#192529');
        panel(u + .045, 0, .012, 3.8, '#536063');
      }
      for (let row = 0; row < 3; row += 1) {
        const z = .27 + row * .255;
        seam(-6, z, 6, z, '#30383a');
        for (let u = -5.9 + (row % 2) * .45; u < 5.9; u += .9) {
          seam(u, z, u, z + .255, '#343b3b');
        }
      }

      if (index % 2 === 0) {
        panel(-2.24, .12, 4.48, 2.78, '#161c1d', '#5c5c50');
        panel(-2.09, .20, 4.18, 2.57, '#454944');
        for (let i = 0; i < 21; i += 1) {
          const z = .21 + i * .12;
          panel(-2.08, z, 4.17, .009, '#252a2a');
          panel(-2.08, z + .012, 4.17, .007, '#53574d');
        }
        panel(-2.22, .16, 4.44, .13, '#34392f');
        panel(-2.28, .12, .12, 2.78, '#5c6056');
        panel(2.16, .12, .12, 2.78, '#5c6056');
        panel(-2.24, 2.83, 4.48, .12, '#535b52');
        panel(-.39, 2.40, .78, .22, '#393d39', '#63665b');
        panel(-.29, 2.49, .58, .021, '#be9b5c');
        for (const s of [-1, 1]) {
          const u = s * 3.02 - .11;
          panel(u, 0, .22, 1.02, '#222526');
          for (let i = 0; i < 5; i += 1) {
            const z = .17 + i * .15;
            shape([point(u, z), point(u + .22, z + .095), point(u + .22, z + .152), point(u, z + .059)], '#b59450');
          }
        }
      } else {
        panel(-.8, .11, 1.6, 2.17, '#161e20', '#5c6460');
        panel(-.67, .15, 1.34, 2.04, '#303d40');
        panel(-.57, 1.40, 1.14, .60, '#131f24', '#616d67');
        seam(-.54, 1.42, .55, 1.98, '#425353');
        panel(-.63, 1.07, 1.27, .052, '#776945');
        panel(.30, .93, .22, .045, '#5a6057');
      }

      for (const u of [-4.9, 2.9]) {
        const top = index % 2 === 0 ? 3.01 : 2.72;
        panel(u - .11, top - .09, 2.27, .77, '#172326', '#586765');
        const glass = ctx.createLinearGradient(0, height * .1, 0, height * .57);
        glass.addColorStop(0, '#a2bbb1');
        glass.addColorStop(1, '#36585d');
        panel(u, top, 2.05, .58, glass);
        for (let i = 1; i < 4; i += 1) panel(u + i * .512, top, .035, .58, '#26373b');
        panel(u, top + .35, 2.05, .028, '#36464a');
        panel(u - .14, top - .10, 2.33, .055, '#78837b');
      }
      for (const u of [-5.84, 5.57]) {
        panel(u, 0, .25, 4, '#303e3e', '#172528');
        panel(u + .16, 0, .07, 4, '#566260');
      }
      panel(-6, 3.81, 12, .19, '#1b2628');
      panel(-6, 3.79, 12, .025, '#586661');

      if (index % 2 === 0) {
        const p = project(point(0, 3.17));
        if (p && p.d < 15) {
          const r = clamp(focal * 1.35 / p.d, 8, 330);
          const glow = ctx.createRadialGradient(p.x, p.y, r * .035, p.x, p.y, r);
          glow.addColorStop(0, 'rgba(242,201,120,.24)');
          glow.addColorStop(.38, 'rgba(231,177,88,.09)');
          glow.addColorStop(1, 'rgba(231,177,88,0)');
          ellipse2(p.x, p.y, r, r, glow);
        }
        panel(-.61, 3.10, 1.22, .16, '#222827', '#8f8968');
        panel(-.51, 3.15, 1.02, .047, '#f4deb0');
      }
    }

    function room() {
      const atmosphere = ctx.createLinearGradient(0, 0, 0, height);
      atmosphere.addColorStop(0, '#162226');
      atmosphere.addColorStop(.49, '#586360');
      atmosphere.addColorStop(1, '#2a3435');
      ctx.fillStyle = atmosphere;
      ctx.fillRect(0, 0, width, height);
      const slab = ctx.createLinearGradient(0, 0, 0, height);
      slab.addColorStop(0, '#29312f');
      slab.addColorStop(.42, '#4d5550');
      slab.addColorStop(.62, '#424a46');
      slab.addColorStop(1, '#273134');
      ground(-6, -6, 6, 6, slab);
      shape([p3(-6, -6, 4), p3(6, -6, 4), p3(6, 6, 4), p3(-6, 6, 4)], '#202d31');
      for (let u = -4.3; u <= 4.4; u += 2.85) {
        shape([p3(u, -6, 3.82), p3(u + .08, -6, 3.82), p3(u + .08, 6, 3.82), p3(u, 6, 3.82)], '#475759');
        shape([p3(-6, u, 3.77), p3(6, u, 3.77), p3(6, u + .12, 3.77), p3(-6, u + .12, 3.77)], '#121d20');
        if (Math.abs(u) < 2) {
          for (const x of [-2.1, 2.1]) {
            shape([p3(x - .55, u, 3.74), p3(x + .55, u, 3.74), p3(x + .55, u + .11, 3.74), p3(x - .55, u + .11, 3.74)], '#bac8b1');
          }
        }
      }
      const walls = [
        (u, z) => p3(u, -6, z), (u, z) => p3(6, u, z),
        (u, z) => p3(-u, 6, z), (u, z) => p3(-6, -u, z),
      ];
      const ordered = walls.map((point, index) => ({point, index, depth: viewPoint(point(0, 0)).z}))
        .sort((a, b) => b.depth - a.depth);
      for (const {point, index} of ordered) {
        if (Math.max(viewPoint(point(-6, 0)).z, viewPoint(point(6, 0)).z) > .02) wall(point, index);
      }
      for (let x = -5; x <= 5; x += 2.5) {
        line3(p3(x, -6, .005), p3(x, 6, .005), 'rgba(15,25,25,.20)', 1);
        line3(p3(-6, x, .006), p3(6, x, .006), 'rgba(15,25,25,.20)', 1);
      }
      for (const y of [-3.45, 3.45]) {
        for (let i = 0; i < 6; i += 1) {
          groundEllipse(0, y, 2.75 - i * .32, 2.16 - i * .25, .009, 'rgba(181,161,116,.038)');
        }
      }
      for (let i = 0; i < 6; i += 1) {
        groundEllipse(0, 0, 3.05 - i * .27, 3.4 - i * .30, .012, 'rgba(159,191,176,.025)');
      }
      for (const s of [-1, 1]) {
        for (let i = -4.9; i < 5; i += .62) {
          ground(s * 4.9 - .035, i, s * 4.9 + .035, i + .31, '#8c8254', .013);
        }
        ground(-2.10, s * 2.08 - .018, 2.10, s * 2.08 + .018, '#9a8d5e', .014);
        ground(s * 2.08 - .018, -2.10, s * 2.08 + .018, 2.10, '#9a8d5e', .014);
        for (const ys of [-1, 1]) {
          const x = s * 2.08, y = ys * 2.08;
          ground(Math.min(x, x - s * .40), y - .039, Math.max(x, x - s * .40), y + .039, '#c4ae6d', .018);
          ground(x - .038, Math.min(y, y - ys * .40), x + .038, Math.max(y, y - ys * .40), '#c4ae6d', .018);
        }
      }
      ground(-.14, -.015, .14, .015, '#7f8a79', .013);
      ground(-.015, -.14, .015, .14, '#7f8a79', .013);
      ctx.globalAlpha = .47;
      if (noise) { ctx.fillStyle = noise; ctx.fillRect(0, 0, width, height); }
      ctx.globalAlpha = 1;
    }


    const hitColors = {
      hit: '#ffd09a', guard: '#80c6c7', parry: '#dbfff1',
      guard_break: '#f6a756', clash: '#d0dbcb',
    };

    function eventByFighter(events, tick, id) {
      for (let i = events.length - 1; i >= 0; i -= 1) {
        const e = events[i];
        if (tick - e.tick > 108) break;
        if (e.type === 'hands_contact' && (e.target === id || e.actor === id)) return e;
      }
      return null;
    }

    function seenAttack(a, tick, event, hold) {
      let active = a.action;
      if (hold && event && tick - event.tick <= 7 && event.actor === a.id &&
          event.action === active?.id && active.phase === 'recovery') {
        active = {...active, phase: 'active', progress: 1};
      }
      return active;
    }

    function motion(a, tick) {
      const speed = Math.hypot(a.vx || 0, a.vy || 0);
      return {stride: Math.sin((a.distance || tick * .004) * 9.4) * clamp(speed / 2.7, 0, .96), speed};
    }

    function outcomeDrop(event, a, tick) {
      if (!event || event.target !== a.id) return 0;
      const strength = {hit: .8, guard: .56, parry: 0, guard_break: 1.15, clash: .64}[event.outcome] || 0;
      return strength * Math.max(0, 1 - (tick - event.tick) / 46);
    }

    function capsule(a, b, start, end, color, light = 1) {
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
      if (length < .4) {
        ellipse2((a.x + b.x) / 2, (a.y + b.y) / 2, Math.max(start, end), Math.max(start, end), color);
        return;
      }
      const nx = -dy / length, ny = dx / length;
      const gradient = ctx.createLinearGradient(a.x - nx * start, a.y - ny * start,
        a.x + nx * start, a.y + ny * start);
      gradient.addColorStop(0, rgb(color, .52 * light));
      gradient.addColorStop(.34, rgb(color, 1.02 * light));
      gradient.addColorStop(.66, rgb(color, .94 * light));
      gradient.addColorStop(1, rgb(color, .66 * light));
      polygon([{x: a.x + nx * start, y: a.y + ny * start}, {x: b.x + nx * end, y: b.y + ny * end},
        {x: b.x - nx * end, y: b.y - ny * end}, {x: a.x - nx * start, y: a.y - ny * start}], gradient);
      ellipse2(b.x, b.y, end, end, rgb(color, .81 * light));
    }

    function figure(a, tick, options, event) {
      const center = project(p3(a.x, a.y, a.z + 1));
      if (!center || center.d < .28 || center.x < -focal || center.x > width + focal) return;
      const attack = seenAttack(a, tick, event, options.hold);
      const phase = attack?.phase;
      const progress = clamp(attack?.progress || 0, 0, 1);
      const data = motion(a, tick);
      const facing = aim(a.yaw);
      const right = {x: -facing.y, y: facing.x};
      const viewVector = {x: camera.x - a.x, y: camera.y - a.y};
      const viewLength = Math.hypot(viewVector.x, viewVector.y) || 1;
      const front = (viewVector.x * facing.x + viewVector.y * facing.y) / viewLength;
      const stagger = clamp((a.stagger || 0) * 3, 0, 1);
      const recoil = outcomeDrop(event, a, tick);
      const prep = phase === 'preparation' ? ease(progress) : 0;
      const extension = phase === 'active' ? 1 : phase === 'recovery' ? 1 - ease(progress) : 0;
      const heavy = attack?.move === 'heavy';
      const angleShift = (heavy ? .11 : .055) * (extension - prep);
      const lean = angleShift - stagger * .20 - recoil * .11;
      const h = (a.body?.height || 1.8) / 1.8;
      const bodyBob = -Math.abs(data.stride) * .044 + Math.sin(tick * .013) * .006 - stagger * .077;
      const color = options.firstId === a.id ?
        {shirt: '#527587', cloth: '#2b3942', trim: '#8ebcbd', skin: '#a77759'} :
        {shirt: '#93654e', cloth: '#3b332e', trim: '#d49776', skin: '#bc8f6f'};
      const local = (side, depth, z) => p3(a.x + right.x * side + facing.x * depth,
        a.y + right.y * side + facing.y * depth, a.z + z * h);
      const px = (side, depth, z) => project(local(side, depth, z));
      const radius = (world, p) => world * focal / (p?.d || center.d);
      const legs = [];
      const arms = [];
      const proxy = options.proxies?.[options.ids.indexOf(a.id)];
      groundEllipse(a.x, a.y, .43, .41, .022, 'rgba(10,17,17,.26)');
      groundEllipse(a.x, a.y, .31, .32, .023, 'rgba(10,17,17,.22)');

      for (const side of ['left', 'right']) {
        const s = side === 'left' ? -1 : 1;
        const step = data.stride * s;
        const hip = px(s * .145, 0, .92 + bodyBob);
        const knee = px(s * (.16 + stagger * .05), step * .20 + s * .08, .49 + bodyBob * .35);
        const footY = step * .37 + s * .115;
        const footZ = .064 + Math.max(step, 0) * .06;
        const ankle = px(s * (.19 + stagger * .05), footY, footZ);
        const toe = px(s * (.204 + stagger * .05), footY + .16, footZ * .73);
        if (hip && knee && ankle && toe) legs.push({hip, knee, ankle, toe, depth: knee.d});

        const ready = !!a.hands?.ready;
        const coverage = a.hands?.coverage?.[side] || 0;
        const shoulder = px(s * .245, lean * .90 + s * angleShift, 1.45 + bodyBob);
        let elbowSide = s * (.29 + coverage * .025);
        let elbowDepth = ready ? .17 : .017;
        let elbowHeight = (ready ? 1.22 : 1.15) + bodyBob;
        let fistSide = s * (.245 - coverage * .09);
        let fistDepth = ready ? .37 + coverage * .04 : .07;
        let fistHeight = (ready ? 1.32 + coverage * .21 : .96) + bodyBob;
        const attackHand = attack?.side === side;
        if (a.hands?.cue?.kind === 'opening') {
          elbowSide += s * .055;
          fistDepth -= .075;
          elbowHeight += .035;
        }
        if (attackHand) {
          const hook = attack.move === 'hook_chop';
          const palm = attack.move === 'counter_palm';
          if (phase === 'reaching' || phase === 'withdrawal') {
            const reach = phase === 'withdrawal' ? 1 - ease(progress) : Math.max(.48, ease(progress));
            fistDepth = mix(.26, .77, reach);
            fistHeight = mix(1.38, 1.31, reach) + bodyBob;
            fistSide = s * mix(.24, .10, reach);
            elbowDepth = fistDepth * .49;
            elbowHeight = fistHeight - .15;
          } else {
            fistSide = s * (.24 + prep * (heavy ? .24 : hook ? .21 : .07) - extension * (hook ? .36 : .15));
            fistDepth = .33 - prep * (heavy ? .48 : .18) + extension * (heavy ? .37 : .38);
            fistHeight = 1.36 + bodyBob + prep * (heavy ? .15 : .12) + extension * (palm ? .08 : .055);
            elbowSide = s * (.30 + prep * (heavy ? .22 : .12) - extension * .10);
            elbowDepth = .15 - prep * (heavy ? .33 : .14) + extension * .23;
            elbowHeight = 1.23 + bodyBob + prep * .13 + extension * .14;
          }
        } else if (a.hands?.reachPrep && side === 'right') {
          fistDepth += .1;
          fistHeight += .07;
        }
        fistDepth -= recoil * .10;
        fistHeight -= stagger * (side === 'right' ? .25 : .18) + recoil * .09;
        const elbow = px(elbowSide, elbowDepth, elbowHeight);
        let fist = px(fistSide, fistDepth, fistHeight);
        if (phase === 'active' && attackHand && proxy?.to && proxy.side === side) {
          const contact = project(proxy.to);
          if (contact && fist) {
            fist = {...fist, x: mix(fist.x, contact.x, .48), y: mix(fist.y, contact.y, .52)};
          }
        }
        if (shoulder && elbow && fist) arms.push({shoulder, elbow, fist, depth: (elbow.d + fist.d * .65) / 1.65,
          open: attackHand && (phase === 'reaching' || attack.move === 'counter_palm')});
      }

      for (const l of legs.sort((a, b) => b.depth - a.depth)) {
        capsule(l.hip, l.knee, radius(.104, l.hip), radius(.082, l.knee), color.cloth);
        capsule(l.knee, l.ankle, radius(.082, l.knee), radius(.052, l.ankle), color.cloth, .94);
        capsule(l.ankle, l.toe, radius(.07, l.ankle), radius(.07, l.toe), '#171d20');
        const sole = radius(.05, l.toe);
        line2({x: l.toe.x - sole, y: l.toe.y + sole * .36},
          {x: l.toe.x + sole, y: l.toe.y + sole * .36}, '#7b7762', radius(.013, l.toe));
      }

      const drawArm = arm => {
        const {shoulder, elbow, fist, open} = arm;
        const mid = {x: mix(elbow.x, shoulder.x, .43), y: mix(elbow.y, shoulder.y, .43), d: mix(elbow.d, shoulder.d, .43)};
        capsule(shoulder, mid, radius(.102, shoulder), radius(.081, mid), color.shirt);
        capsule(mid, elbow, radius(.073, mid), radius(.061, elbow), color.skin, .86);
        capsule(elbow, fist, radius(.061, elbow), radius(.048, fist), color.skin, .98);
        const cuff = {x: mix(elbow.x, fist.x, .81), y: mix(elbow.y, fist.y, .81), d: mix(elbow.d, fist.d, .81)};
        capsule(cuff, fist, radius(.049, cuff), radius(.054, fist), color.cloth, 1.38);
        const r = radius(open ? .093 : .081, fist);
        const rotation = Math.atan2(fist.y - elbow.y, fist.x - elbow.x);
        ellipse2(fist.x, fist.y, r, r * (open ? .66 : .86), color.skin, rotation, '#453b34');
        ellipse2(fist.x + Math.cos(rotation) * r * .30, fist.y + Math.sin(rotation) * r * .30, r * .43, r * .35, rgb(color.skin, 1.21), rotation);
      };
      arms.sort((a, b) => b.depth - a.depth);
      for (const arm of arms.filter(arm => arm.depth > center.d + .02)) drawArm(arm);

      const waist = px(0, 0, .93 + bodyBob);
      const shoulders = px(0, lean, 1.46 + bodyBob);
      if (!waist || !shoulders) return;
      const sideFactor = .47 + Math.abs(front) * .53;
      const torso = [
        {x: shoulders.x - radius(.258 * sideFactor, shoulders), y: shoulders.y - radius(.037, shoulders)},
        {x: shoulders.x + radius(.258 * sideFactor, shoulders), y: shoulders.y - radius(.037, shoulders)},
        {x: shoulders.x + radius(.244 * sideFactor, shoulders), y: shoulders.y + radius(.11, shoulders)},
        {x: waist.x + radius(.182 * sideFactor, waist), y: waist.y},
        {x: waist.x - radius(.182 * sideFactor, waist), y: waist.y},
        {x: shoulders.x - radius(.244 * sideFactor, shoulders), y: shoulders.y + radius(.11, shoulders)},
      ];
      const fold = ctx.createLinearGradient(torso[0].x, torso[0].y, torso[1].x + 1, torso[1].y);
      fold.addColorStop(0, rgb(color.shirt, .50));
      fold.addColorStop(.41, color.shirt);
      fold.addColorStop(.72, rgb(color.shirt, 1.1));
      fold.addColorStop(1, rgb(color.shirt, .67));
      polygon(torso, fold, '#263133');
      const seamY = mix(shoulders.y, waist.y, .39);
      line2({x: waist.x - radius(.17 * sideFactor, waist), y: waist.y},
        {x: waist.x + radius(.17 * sideFactor, waist), y: waist.y}, '#1a2427', radius(.035, waist));
      if (front > -.12) {
        line2({x: shoulders.x - radius(.145 * sideFactor, shoulders), y: seamY},
          {x: shoulders.x + radius(.13 * sideFactor, shoulders), y: seamY + radius(.01, shoulders)},
          color.trim, radius(.023, shoulders));
      } else {
        line2({x: shoulders.x, y: shoulders.y + radius(.05, shoulders)},
          {x: waist.x, y: waist.y - radius(.055, waist)}, rgb(color.shirt, 1.16), radius(.021, shoulders));
      }

      const neck = px(0, lean * 1.24, 1.49 + bodyBob);
      const head = px(0, lean * 1.44 + .018, 1.655 + bodyBob);
      if (neck && head) {
        capsule(neck, head, radius(.068, neck), radius(.05, head), color.skin, .72);
        const r = radius(.112, head);
        const offsetX = (viewVector.y * facing.x - viewVector.x * facing.y) / viewLength;
        const faceGradient = ctx.createLinearGradient(head.x - r, head.y, head.x + r, head.y);
        faceGradient.addColorStop(0, rgb(color.skin, .59));
        faceGradient.addColorStop(.63, color.skin);
        faceGradient.addColorStop(1, rgb(color.skin, 1.15));
        ellipse2(head.x, head.y, r * (.84 + Math.max(0, front) * .13), r * 1.24, faceGradient, stagger * .14);
        ellipse2(head.x - r * .07 * offsetX, head.y - r * .68, r * .86, r * .53, '#2b3030', -.08);
        if (front > -.15) {
          const faceX = head.x + offsetX * r * .51;
          if (front > .32) {
            for (const side of [-1, 1]) {
              const eyeX = faceX + side * r * .34 * front + offsetX * r * .06;
              const eyeY = head.y - r * .09;
              ellipse2(eyeX, eyeY, r * .15, r * .047, '#352f2a');
              line2({x: eyeX - r * .14, y: eyeY - r * .13}, {x: eyeX + r * .14, y: eyeY - r * .12},
                '#554136', Math.max(.65, r * .07));
            }
          }
          const smileY = head.y + r * .64;
          line2({x: faceX - r * .22, y: smileY}, {x: faceX + r * .22, y: smileY - .4},
            '#665043', Math.max(.7, r * .055));
          if (front < .65) {
            polygon([{x: faceX + offsetX * r * .12, y: head.y - r * .13},
              {x: faceX + offsetX * r * .63, y: head.y + r * .19},
              {x: faceX + offsetX * r * .03, y: head.y + r * .29}], rgb(color.skin, 1.13));
          }
        }
      }
      for (const arm of arms.filter(arm => arm.depth <= center.d + .02)) drawArm(arm);
      if (options.debug) {
        const foot = px(0, 0, .003);
        const eyes = px(0, 0, a.body?.eye || 1.62);
        line2(foot, eyes, '#669d9c');
        if (foot) ellipse2(foot.x, foot.y, radius(a.body?.radius || .29, foot), radius(.05, foot), null, '#91e3d2');
      }
    }


    const movePoses = {
      lead_light: ['leadWindup', 'leadContact'],
      rear_light: ['rearWindup', 'rearContact'],
      hook_chop: ['hookWindup', 'hookContact'],
      counter_palm: ['rearWindup', 'interception'],
      heavy: ['heavyWindup', 'heavyContact'],
    };

    function drawHand(poseName, side, target, bend, stretch, color, options) {
      const record = art.poses[poseName] || art.poses.ready;
      const im = images[record.file];
      const s = side === 'right' ? 1 : -1;
      const mirror = ((s === 1) === record.flipForRight) ? -1 : 1;
      const dx = (record.wrist[0] - record.strike[0]) * mirror;
      const dy = record.wrist[1] - record.strike[1];
      const faceScale = stretch / (Math.hypot(dx, dy) || 1);
      const angle = Math.atan2(1, s * bend) - Math.atan2(dy, dx);
      const c = Math.cos(angle), sin = Math.sin(angle);
      const spritePoint = (x, y) => {
        const u = (x - record.strike[0]) * mirror * faceScale;
        const v = (y - record.strike[1]) * faceScale;
        return {x: target.x + c * u - sin * v, y: target.y + sin * u + c * v};
      };
      const wrist = spritePoint(...record.wrist);
      const span = record.wristSpan || [record.wrist[0] - 18, record.wrist[0] + 18];
      // Build the cuff from the exact visible cut edge so it stays attached as the sprite rotates.
      const edges = span.map(x => spritePoint(x, record.wrist[1] - 1.5));
      edges.sort((a, b) => a.x - b.x);
      const sleeve = {x: width / 2 + s * width * .36, y: height * 1.13};
      const sx = sleeve.x - wrist.x, sy = sleeve.y - wrist.y;
      const length = Math.hypot(sx, sy) || 1;
      const ux = sx / length, uy = sy / length;
      const ww = Math.hypot(edges[1].x - edges[0].x, edges[1].y - edges[0].y) / 2;
      const skin = '#a47556';
      const forearm = [
        {x: sleeve.x - uy * ww * 1.72, y: sleeve.y + ux * ww * 1.72},
        {x: sleeve.x + uy * ww * 1.72, y: sleeve.y - ux * ww * 1.72},
      ];
      const row = (d, wide = 1) => edges.map(edge => ({
        x: wrist.x + (edge.x - wrist.x) * wide + ux * d,
        y: wrist.y + (edge.y - wrist.y) * wide + uy * d,
      }));
      const wrapEnd = row(26, 1.11);
      const sleeveShade = ctx.createLinearGradient(wrapEnd[0].x, wrapEnd[0].y, wrapEnd[1].x, wrapEnd[1].y);
      sleeveShade.addColorStop(0, rgb(color, .38));
      sleeveShade.addColorStop(.43, rgb(color, .97));
      sleeveShade.addColorStop(.72, rgb(color, .80));
      sleeveShade.addColorStop(1, rgb(color, .48));
      polygon([...wrapEnd, forearm[1], forearm[0]], sleeveShade);
      if (im) {
        const wrapBack = row(-3, 1);
        const wrapShade = ctx.createLinearGradient(edges[0].x, edges[0].y, edges[1].x + .01, edges[1].y);
        wrapShade.addColorStop(0, '#373832');
        wrapShade.addColorStop(.42, '#6f7568');
        wrapShade.addColorStop(1, '#4b5048');
        polygon([...wrapBack, wrapEnd[1], wrapEnd[0]], wrapShade);
        for (const d of [5, 12, 20]) {
          const band = row(d, mix(1, 1.11, d / 26));
          line2(band[0], band[1], '#454c43', 1.2);
        }
      }
      if (im) {
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(angle);
        ctx.scale(mirror * faceScale, faceScale);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(im, -record.strike[0], -record.strike[1]);
        ctx.restore();
      } else {
        capsule(wrist, target, ww * .86, ww * .78, skin, .9);
      }
      if (options.debug || options.poseStep != null) {
        line2(wrist, target, 'rgba(163,246,219,.85)');
        ellipse2(wrist.x, wrist.y, 3, 3, '#87cea6');
        ellipse2(target.x, target.y, 4, 4, null, '#eadc83');
      }
      return {side, pose: poseName, file: record.file, wrist, strike: target, mirror, fallback: !im};
    }

    function firstPerson(a, tick, options, event) {
      const attack = seenAttack(a, tick, event, options.hold);
      const phase = attack?.phase;
      const t = clamp(attack?.progress || 0, 0, 1);
      const s = attack?.side === 'left' ? -1 : 1;
      const movement = motion(a, tick);
      const recoil = outcomeDrop(event, a, tick);
      const stagger = clamp((a.stagger || 0) * 2.4, 0, 1);
      const widthScale = clamp(width / 1280, .67, 1.15);
      const color = options.firstId === a.id ? '#506e74' : '#725448';
      const stance = a.hands?.ready;
      const guardLevel = a.hands?.guardLevel || 0;
      const orderCount = art.poseOrder.length;
      const pStep = options.poseStep == null ? null :
        art.poseOrder[((options.poseStep % orderCount) + orderCount) % orderCount];
      const swing = movement.stride * 12;
      const breathe = Math.sin(tick * .018) * 3.7;
      const result = [];
      const order = attack?.side === 'left' ? ['right', 'left'] : ['left', 'right'];
      for (const side of order) {
        const sign = side === 'left' ? -1 : 1;
        const cover = a.hands?.coverage?.[side] || 0;
        let x = width / 2 + sign * (228 - 74 * cover) * widthScale;
        let y = stance ? 534 - 82 * cover : 687;
        let pose = stance ? (cover >= .69 || guardLevel >= .84 && cover > .35 ? 'tightGuard' : cover >= .25 ? 'lowGuard' : 'ready') : 'relaxed';
        let scale = stance ? 130 - cover * 21 : 85;
        let bend = .57;
        y += swing * sign + breathe + stagger * 96 + recoil * 52;
        if (phase && side === attack.side) {
          if (phase === 'preparation') {
            const windup = ease(t);
            const heavy = attack.move === 'heavy';
            pose = movePoses[attack.move]?.[0] || 'ready';
            x += sign * (heavy ? 94 : 28) * windup * widthScale;
            y += (heavy ? 59 : 26) * windup;
            scale += (heavy ? 64 : 34) * windup;
            bend += windup * .4;
          } else if (phase === 'active' || phase === 'recovery') {
            const hook = attack.move === 'hook_chop';
            const heavy = attack.move === 'heavy';
            const extend = phase === 'active' ? 1 : 1 - ease(t);
            const guardOrParry = event?.actor === a.id && ['guard', 'parry', 'clash'].includes(event.outcome);
            pose = phase === 'recovery' && t > .31 ? (guardOrParry && t < .64 ? 'recoil' : 'ready')
              : movePoses[attack.move]?.[1] || 'leadContact';
            const contactX = width / 2 + s * (hook ? -36 : 23) * widthScale;
            const contactY = heavy ? 383 : 400;
            x = mix(x, contactX, extend);
            y = mix(y, contactY, extend);
            scale = mix(scale, heavy ? 116 : hook ? 140 : 126, extend);
            bend = mix(bend, hook ? 1.8 : 1.02, extend);
            const proxy = options.proxies?.[options.ids.indexOf(a.id)];
            const contact = proxy?.to ? project(proxy.to) : null;
            if (contact && phase === 'active') {
              x = mix(x, clamp(contact.x, width * .28, width * .72), .57);
              y = mix(y, clamp(contact.y, height * .45, height * .67), .63);
            }
          } else {
            const reach = phase === 'withdrawal' ? 1 - ease(t) : Math.max(.52, ease(t));
            pose = phase === 'withdrawal' && t > .23 ? 'reachWithdraw' : 'reachExtend';
            x = mix(x, width / 2 + s * 47, reach);
            y = mix(y, 427, reach);
            scale = mix(scale, 226, reach);
            bend = mix(bend, 1.6, reach);
          }
        } else if (a.hands?.reachPrep && side === 'right' && !attack) {
          pose = 'reachPrepare';
          y -= 27;
          scale = 154;
        }
        if (recoil > .35 && !attack && stance) pose = 'recoil';
        if (pStep) {
          pose = pStep;
          x = width / 2 + sign * 198 * widthScale;
          y = 463;
          bend = .57;
          scale = 152;
        }
        result.push(drawHand(pose, side, {x, y}, bend, scale, color, options));
      }
      return result;
    }

    function contactEffects(tick, events) {
      for (let i = Math.max(0, events.length - 20); i < events.length; i += 1) {
        const e = events[i];
        const age = tick - e.tick;
        if (age > 43 || e.type !== 'hands_contact' || !e.contact || age < 0) continue;
        const p = project(e.contact);
        if (!p) continue;
        const color = hitColors[e.outcome] || hitColors.hit;
        const alpha = (1 - age / 43) ** 2 * .85;
        const reach = clamp(22 / p.d, 8, 56) * (.6 + age / 28);
        ctx.globalAlpha = alpha;
        for (let j = 0; j < 5; j += 1) {
          const theta = j * Math.PI * .4 + (e.tick % 60) * .048;
          const x = Math.cos(theta) * reach, y = Math.sin(theta) * reach * .68;
          line2({x: p.x + x * .56, y: p.y + y * .56}, {x: p.x + x, y: p.y + y}, color, e.outcome === 'parry' ? 2.2 : 1.6);
        }
        if (e.outcome !== 'hit') ellipse2(p.x, p.y, reach * .44, reach * .41, null, color);
        ctx.globalAlpha = 1;
      }
    }

    function debugProxies(options) {
      if (!options.debug) return;
      for (const p of options.proxies || []) {
        if (!p || !p.from || !p.to) continue;
        const color = p.side === 'left' ? '#90e0c4' : '#e9b575';
        line3(p.from, p.to, color, 2);
        const b = project(p.to);
        if (b) ellipse2(b.x, b.y, clamp(p.radius * focal / b.d, 2, 72),
          clamp(p.radius * focal / b.d, 2, 72), null, color);
      }
    }

    function vignette() {
      const glow = ctx.createRadialGradient(width / 2, height * .47, height * .19,
        width / 2, height * .52, Math.max(width * .57, height * .73));
      glow.addColorStop(0, 'rgba(9,17,18,0)');
      glow.addColorStop(.67, 'rgba(8,15,17,.05)');
      glow.addColorStop(1, 'rgba(8,15,17,.51)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    function draw(snapshot, settings = {}) {
      const controlled = snapshot.actors.find(a => a.id === snapshot.controlId) || snapshot.actors[0];
      if (!controlled) return;
      const options = {view: 'first', orbit: 0, pitch: 0, events: [], effects: true, hold: true,
        ...settings, firstId: snapshot.actors[0].id, ids: snapshot.actors.map(a => a.id)};
      const external = options.view === 'external';
      const observed = snapshot.actors.find(a => a.id === options.subjectId) || controlled;
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      const pixelWidth = Math.max(1, Math.round((bounds.width || 1280) * dpr));
      const pixelHeight = Math.max(1, Math.round((bounds.height || 720) * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      width = height * pixelWidth / pixelHeight;
      focal = Math.min(553, width * .57);
      ctx.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
      offset = {x: 0, y: 0};
      const controlledEvent = eventByFighter(options.events, snapshot.tick, controlled.id);
      if (!external && options.effects && controlledEvent) {
        const dt = snapshot.tick - controlledEvent.tick;
        const strength = (controlledEvent.outcome === 'guard_break' ? 9 : 4) * Math.max(0, 1 - dt / 21);
        offset = {x: Math.sin(dt * 1.4) * strength, y: Math.cos(dt * 1.1) * strength * .62};
      }
      if (external) {
        const pos = aim(observed.yaw + options.orbit);
        const x = clamp(observed.x + pos.x * 3.45, -5.80, 5.80);
        const y = clamp(observed.y + pos.y * 3.45, -5.80, 5.80);
        const facing = Math.atan2(observed.x - x, y - observed.y) / rad;
        setCamera(x, y, observed.z + 1.82, facing, -10);
      } else {
        const walk = motion(controlled, snapshot.tick);
        const bob = options.effects ? Math.abs(walk.stride) * .025 : 0;
        setCamera(controlled.x, controlled.y, controlled.z + (controlled.body?.eye || 1.62) + bob,
          controlled.yaw, options.pitch - 3);
      }
      room();
      const bodies = external ? [observed] : snapshot.actors.filter(a => a.id !== controlled.id);
      bodies.sort((a, b) => viewPoint(p3(b.x, b.y, b.z)).z - viewPoint(p3(a.x, a.y, a.z)).z);
      for (const a of bodies) figure(a, snapshot.tick, options, eventByFighter(options.events, snapshot.tick, a.id));
      if (options.effects) contactEffects(snapshot.tick, options.events);
      const hands = external ? [] : firstPerson(controlled, snapshot.tick, options, controlledEvent);
      debugProxies(options);
      vignette();
      report = {
        renderer: 'Canvas2D', view: external ? 'external' : 'first', orbit: options.orbit,
        resolution: [canvas.width, canvas.height], subjectId: external ? observed.id : controlled.id,
        poseCount: art.poseOrder.length, frameTick: snapshot.tick, assets: {
          loaded: Object.keys(images).length, total: Object.keys(art.assets).length, failures: [...failures],
        },
        camera: {x: camera.x, y: camera.y, z: camera.z, yaw: camera.yaw, pitch: camera.pitch},
        fighters: snapshot.actors.map(a => ({
          id: a.id, actionId: a.action?.id || null, phase: a.action?.phase || null, hand: a.action?.side || null,
        })),
        hands,
      };
    }

    function setCamera(x, y, z, yaw, pitch) {
      const direction = aim(yaw);
      camera = {
        x, y, z, yaw, pitch,
        fx: direction.x, fy: direction.y, rx: -direction.y, ry: direction.x,
        cosPitch: Math.cos(pitch * rad), sinPitch: Math.sin(pitch * rad),
      };
    }

    return {draw, inspect: () => report, ready};
  }

  return {create};
})();
