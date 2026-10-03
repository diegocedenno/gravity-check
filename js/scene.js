/* Escena: el astronauta grande del mundo elegido y los diez pequeños de la tira.
   Un único bucle requestAnimationFrame mueve los once con la misma física,
   y(t) = v0·t − ½·g·t², en tiempo real; por frame solo se escriben `transform`
   y `opacity`. Con prefers-reduced-motion no hay bucle: cada astronauta queda
   quieto en el punto más alto de su salto. */
(function () {
  "use strict";

  var App = (window.GravityCheck = window.GravityCheck || {});
  var physics = App.physics;
  var worlds = App.worlds;
  var node = worlds.node;
  var fmt = physics.fmt;

  var ASTRO_M = 1.8; // estatura con traje, en metros
  var ASTRO_TOP = 101; // esa estatura en unidades del dibujo (el casco acaba en y = −101)
  var ASTRO_BOX = { w: 64, h: 104 }; // viewBox del astronauta
  var LEG = 16; // largo del muslo y de la pantorrilla, en unidades del dibujo
  var MINI_MIN = 18; // px: por debajo de esto el astronauta de la tira no se lee
  var MIN_VIEW = 3.4; // metros que abarca la escena como mínimo
  var RAD = Math.PI / 180;

  function reduced() {
    return window.Pluton && window.Pluton.reducedMotion();
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function trim(value) {
    return String(Math.round(value * 10) / 10).replace(".", ",");
  }

  App.createScene = function (options) {
    var stage = options.stage;
    var view = stage.querySelector(".stage-view");
    var bg = stage.querySelector(".stage-bg");
    var groundLayer = bg.querySelector("#ground");
    var rulerLayer = bg.querySelector("#ruler");
    var clipCircle = bg.querySelector("#gc-ground circle");
    var jumper = stage.querySelector(".astro-wrap");
    var astro = jumper.querySelector(".astro");
    var shadow = stage.querySelector(".astro-shadow");
    var hudT = options.hudT;
    var hudY = options.hudY;
    var strip = options.strip;
    var gridLayer = options.grid;
    var columns = options.columns; // [{ sky, jumper, apex }] en el orden de WORLDS

    var part = {};
    ["body", "leg-l", "shin-l", "boot-l", "leg-r", "shin-r", "boot-r", "arm-l", "arm-r"].forEach(function (name) {
      part[name] = astro.querySelector('[data-part="' + name + '"]');
    });

    var model = null; // { jumps, index, earthHeight }
    var shown = null; // lo que está pintado en la escena: { jump, ppm, index }
    var stripPpm = 0;
    var clock = 0; // tiempo de simulación en ms; se detiene con la pestaña oculta
    var t0 = 0;
    var lastFrame = 0;
    var frame = 0;
    var fadeTimer = 0;
    var last = { main: "", limbs: "", shadow: "", hud: "", hudAt: 0, minis: [] };

    /* ---------- escena principal ---------- */

    function text(x, y, content, cls, anchor) {
      var el = node("text", { x: x.toFixed(1), y: y.toFixed(1), class: "ruler-text " + (cls || ""), "text-anchor": anchor || "start" }, rulerLayer);
      el.textContent = content;
      return el;
    }

    function line(x1, y1, x2, y2, cls) {
      return node("line", { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), class: cls }, rulerLayer);
    }

    function paintRuler(geo) {
      var jump = geo.jump;
      var x0 = 46;
      var step = physics.niceStep(geo.view, 7);
      var half = (ASTRO_BOX.w / 2) * geo.k;

      worlds.clear(rulerLayer);
      line(x0, geo.gy, x0, geo.top - 8, "ruler-axis");
      for (var i = 0; i * step <= geo.view + 1e-9; i++) {
        var y = geo.gy - i * step * geo.ppm;
        line(x0 - 5, y, x0, y, "ruler-axis");
        text(x0 - 9, y + 4, trim(i * step) + ((i + 1) * step > geo.view + 1e-9 ? " m" : ""), "", "end");
      }
      line(x0, geo.gy, geo.W - 14, geo.gy, "ruler-zero");

      // Referencia: lo que saltas en la Tierra, si no se pisa con la marca del mundo.
      var earthY = geo.gy - model.earthHeight * geo.ppm;
      var apexY = geo.gy - jump.height * geo.ppm;
      if (Math.abs(earthY - apexY) > 20) {
        line(x0, earthY, Math.max(x0 + 40, geo.cx - half - 12), earthY, "ruler-earth");
        text(x0 + 8, earthY - 6, "Tierra " + fmt(model.earthHeight, 2) + " m", "ruler-earth-text");
      }

      // Recorrido del salto: del suelo a la altura máxima.
      line(geo.cx, geo.gy, geo.cx, apexY, "ruler-path");

      var label = "máx. " + fmt(jump.height, 2) + " m";
      var labelX = Math.min(geo.cx + half + 10, geo.W - 14 - label.length * 7.4);
      line(x0, apexY, Math.min(geo.W - 14, labelX + label.length * 7.4), apexY, "ruler-apex");
      text(labelX, apexY - 7, label, "ruler-apex-text");
    }

    function layoutStage() {
      var W = stage.clientWidth;
      var H = stage.clientHeight;
      if (!W || !H || !model) return;

      var jump = model.jumps[model.index];
      var band = H < 300 ? 46 : 64; // alto de la franja de suelo
      var top = 44; // sitio para los rótulos de arriba
      var gy = H - band;
      // La escala se ajusta al salto: caben la altura máxima y el astronauta entero.
      var span = Math.max(jump.height + ASTRO_M + 0.35, MIN_VIEW);
      var ppm = (gy - top) / span;
      var k = (ASTRO_M * ppm) / ASTRO_TOP; // px por unidad del dibujo
      var geo = {
        W: W,
        H: H,
        gy: gy,
        top: top,
        view: span,
        ppm: ppm,
        k: k,
        cx: Math.round(W * (W < 520 ? 0.56 : 0.5)),
        jump: jump,
        clip: clipCircle,
      };

      bg.setAttribute("viewBox", "0 0 " + W + " " + H);
      worlds.paintGround(groundLayer, physics.WORLDS[model.index], geo);
      paintRuler(geo);

      // El SVG se dimensiona en px reales (nada de escalar un bitmap): por frame solo se traslada.
      astro.style.width = (ASTRO_BOX.w * k).toFixed(1) + "px";
      astro.style.height = (ASTRO_BOX.h * k).toFixed(1) + "px";
      jumper.style.left = (geo.cx - (ASTRO_BOX.w * k) / 2).toFixed(1) + "px";
      jumper.style.top = (gy - ASTRO_BOX.h * k).toFixed(1) + "px";

      var sw = 46 * k;
      var sh = Math.max(4, 8 * k);
      shadow.style.width = sw.toFixed(1) + "px";
      shadow.style.height = sh.toFixed(1) + "px";
      shadow.style.left = (geo.cx - sw / 2).toFixed(1) + "px";
      shadow.style.top = (gy - sh * 0.3).toFixed(1) + "px";

      shown = { jump: jump, ppm: ppm, index: model.index };
      last.main = last.limbs = last.shadow = last.hud = "";
    }

    function setLimbs(crouch, air) {
      var key = crouch.toFixed(3) + "|" + air.toFixed(3);
      if (key === last.limbs) return;
      last.limbs = key;

      // Muslo y pantorrilla giran en sentidos opuestos: la rodilla sale y el pie no se mueve.
      var a = clamp(crouch, 0, 1) * 40;
      var drop = crouch < 0 ? crouch * 3 : 2 * LEG * (1 - Math.cos(a * RAD));
      var arm = air * 58 - clamp(crouch, 0, 1) * 8;
      var at = a.toFixed(2);

      part.body.setAttribute("transform", "translate(0 " + drop.toFixed(2) + ")");
      part["leg-l"].setAttribute("transform", "rotate(" + at + " -6.5 -36)");
      part["shin-l"].setAttribute("transform", "rotate(" + (-2 * a).toFixed(2) + " -6.5 -20)");
      part["boot-l"].setAttribute("transform", "rotate(" + at + " -6.5 -4)");
      part["leg-r"].setAttribute("transform", "rotate(-" + at + " 6.5 -36)");
      part["shin-r"].setAttribute("transform", "rotate(" + (2 * a).toFixed(2) + " 6.5 -20)");
      part["boot-r"].setAttribute("transform", "rotate(-" + at + " 6.5 -4)");
      part["arm-l"].setAttribute("transform", "rotate(" + arm.toFixed(2) + " -15 -60)");
      part["arm-r"].setAttribute("transform", "rotate(" + (-arm).toFixed(2) + " 15 -60)");
    }

    function setHud(p, now) {
      // Texto a ~11 Hz: se lee bien y no obliga a recalcular nada en cada frame.
      if (p.phase === "flight" && now - last.hudAt < 90) return;
      var key = p.t.toFixed(2) + "|" + p.y.toFixed(2);
      if (key === last.hud) return;
      last.hud = key;
      last.hudAt = now;
      hudT.textContent = fmt(p.t, 2) + " s";
      hudY.textContent = fmt(p.y, 2) + " m";
    }

    function drawMain(p, now) {
      var move = "translate3d(0," + (-p.y * shown.ppm).toFixed(1) + "px,0)";
      if (move !== last.main) {
        last.main = move;
        jumper.style.transform = move;
      }
      setLimbs(p.crouch, p.air);

      // La sombra se encoge y se aclara al subir: da la altura sin mirar la regla.
      var lift = clamp(p.y / 1.2, 0, 1);
      var shade = (1 - 0.45 * lift).toFixed(3) + "|" + (0.5 - 0.3 * lift).toFixed(3);
      if (shade !== last.shadow) {
        last.shadow = shade;
        shadow.style.transform = "scale(" + (1 - 0.45 * lift).toFixed(3) + ")";
        shadow.style.opacity = (0.5 - 0.3 * lift).toFixed(3);
      }
      setHud(p, now);
    }

    /* ---------- tira comparativa ---------- */

    function layoutStrip() {
      var skyHeight = columns[0].sky.clientHeight;
      if (!skyHeight || !model) return;

      var highest = 0;
      model.jumps.forEach(function (jump) {
        highest = Math.max(highest, jump.height);
      });

      // Una sola escala para los diez: el salto más alto llega justo arriba.
      var room = skyHeight - 6;
      var ppm = room / (highest + ASTRO_M);
      var tall = ASTRO_M * ppm;
      if (tall < MINI_MIN) {
        // Salto enorme: el astronauta deja de ir a escala para seguir siendo visible.
        tall = MINI_MIN;
        ppm = (room - MINI_MIN) / highest;
      }
      stripPpm = ppm;
      strip.style.setProperty("--astro-h", ((tall * ASTRO_BOX.h) / ASTRO_TOP).toFixed(1) + "px");

      columns.forEach(function (column, i) {
        column.apex.style.transform = "translateY(" + (-model.jumps[i].height * ppm).toFixed(1) + "px)";
      });

      // Líneas de la escala, una tanda por fila (en móvil la tira ocupa dos).
      var box = strip.getBoundingClientRect();
      var rows = [];
      columns.forEach(function (column) {
        var topEdge = Math.round(column.sky.getBoundingClientRect().top - box.top);
        if (rows.indexOf(topEdge) === -1) rows.push(topEdge);
      });
      var step = physics.niceStep(highest + ASTRO_M, 5);
      worlds.clear(gridLayer);
      rows.forEach(function (rowTop) {
        for (var i = 0; i * step * ppm <= skyHeight - 10; i++) {
          var mark = document.createElement("i");
          mark.style.top = (rowTop + skyHeight - i * step * ppm).toFixed(1) + "px";
          if (i === 0) {
            mark.className = "is-zero";
          } else {
            var label = document.createElement("span");
            label.textContent = trim(i * step) + " m";
            mark.appendChild(label);
          }
          gridLayer.appendChild(mark);
        }
      });
      last.minis = [];
    }

    function drawMini(i, p) {
      // Sin articulaciones a este tamaño: la flexión es un aplastamiento desde los pies.
      var move =
        "translate3d(0," + (-p.y * stripPpm).toFixed(1) + "px,0) scale(" + (1 + 0.08 * p.crouch).toFixed(3) + "," + (1 - 0.16 * p.crouch).toFixed(3) + ")";
      if (move === last.minis[i]) return;
      last.minis[i] = move;
      columns[i].jumper.style.transform = move;
    }

    /* ---------- dibujo y bucle ---------- */

    function drawAll(now) {
      if (!model) return;
      var still = reduced();
      var tau = clock - t0;
      for (var i = 0; i < model.jumps.length; i++) {
        var p = still ? physics.apex(model.jumps[i]) : physics.pose(model.jumps[i], tau);
        if (stripPpm) drawMini(i, p);
        if (shown && i === shown.index) drawMain(still ? physics.apex(shown.jump) : physics.pose(shown.jump, tau), now);
      }
    }

    function tick(now) {
      clock += Math.min(now - lastFrame, 100);
      lastFrame = now;
      drawAll(now);
      frame = requestAnimationFrame(tick);
    }

    function start() {
      if (frame || reduced() || document.hidden || !model) return;
      lastFrame = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }

    // Todos despegan a la vez; después cada uno sigue el ritmo de su gravedad.
    function sync() {
      t0 = clock + 140;
      last.hudAt = 0;
      drawAll(performance.now());
      start();
    }

    function update(next, fade) {
      model = next;
      layoutStrip();
      window.clearTimeout(fadeTimer);

      if (fade && shown) {
        // Cambio de mundo: la escena se funde, se repinta con su nueva escala y vuelve.
        view.classList.add("is-switching");
        fadeTimer = window.setTimeout(function () {
          layoutStage();
          view.classList.remove("is-switching");
          sync();
        }, 170);
        drawAll(performance.now());
      } else {
        view.classList.remove("is-switching");
        layoutStage();
        sync();
      }
    }

    /* ---------- eventos ---------- */

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    if (window.matchMedia) {
      var query = window.matchMedia("(prefers-reduced-motion: reduce)");
      var onMotionChange = function () {
        if (query.matches) stop();
        last.main = last.limbs = last.shadow = last.hud = "";
        last.minis = [];
        sync();
        if (options.onMotionChange) options.onMotionChange(query.matches);
      };
      if (query.addEventListener) query.addEventListener("change", onMotionChange);
    }

    function relayout() {
      layoutStrip();
      // Durante un fundido la escena se repinta sola al terminar.
      if (!view.classList.contains("is-switching")) layoutStage();
      drawAll(performance.now());
    }

    if (window.ResizeObserver) {
      var observer = new ResizeObserver(relayout);
      observer.observe(stage);
      observer.observe(strip);
    } else {
      window.addEventListener("resize", relayout);
    }

    return {
      update: update,
      sync: sync,
    };
  };
})();
