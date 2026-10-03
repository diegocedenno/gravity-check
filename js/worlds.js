/* Aspecto de los mundos: el disco pequeño de la tira y el suelo curvo de la escena.
   Discos sobrios, con los tonos de la paleta Plutón y un detalle propio por mundo.
   Plutón no se redibuja: usa el pluto.svg compartido, con su corazón. */
(function () {
  "use strict";

  var App = (window.GravityCheck = window.GravityCheck || {});
  var SVG_NS = "http://www.w3.org/2000/svg";

  function node(name, attrs, parent) {
    var el = document.createElementNS(SVG_NS, name);
    for (var key in attrs) el.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(el);
    return el;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  // size: px del disco en la tira · ground: qué se dibuja bajo los pies en la escena.
  var LOOKS = {
    mercury: { base: "#9aa1a9", dark: "#6e7681", light: "#cfd6dd", size: 24, ground: "craters" },
    venus: { base: "#dcc6a2", dark: "#c9a27e", light: "#efe3d3", size: 30, ground: "bands" },
    earth: { base: "#58a6ff", dark: "#3b78c4", light: "#e6edf3", size: 30, ground: "land" },
    moon: { base: "#cfd6dd", dark: "#8b949e", light: "#f4f6f8", size: 22, ground: "craters" },
    mars: { base: "#c8683c", dark: "#8f4526", light: "#efe3d3", size: 26, ground: "craters" },
    jupiter: { base: "#c9a27e", dark: "#8a6548", light: "#efe3d3", size: 40, ground: "bands" },
    saturn: { base: "#d9c19e", dark: "#b98a66", light: "#efe3d3", size: 56, ground: "bands" },
    uranus: { base: "#9cc7ff", dark: "#6fa8e8", light: "#e6edf3", size: 34, ground: "bands" },
    neptune: { base: "#3f7fd0", dark: "#2c5c9c", light: "#9cc7ff", size: 34, ground: "bands" },
    pluto: { base: "#c9a27e", dark: "#a67d5c", light: "#efe3d3", size: 26, ground: "heart" },
  };

  // Detalles de cada disco, en el mismo lienzo que pluto.svg (120×120, radio 52).
  var FEATURES = {
    mercury: function (g, k) {
      node("circle", { cx: 40, cy: 44, r: 9, fill: k.dark, opacity: 0.45 }, g);
      node("circle", { cx: 80, cy: 70, r: 11, fill: k.dark, opacity: 0.4 }, g);
      node("circle", { cx: 72, cy: 34, r: 4.5, fill: k.dark, opacity: 0.5 }, g);
      node("circle", { cx: 48, cy: 84, r: 6, fill: k.dark, opacity: 0.45 }, g);
      node("circle", { cx: 26, cy: 68, r: 3.5, fill: k.dark, opacity: 0.5 }, g);
      node("circle", { cx: 92, cy: 46, r: 3, fill: k.light, opacity: 0.6 }, g);
    },
    venus: function (g, k) {
      node("path", { d: "M4 42 C30 32 60 52 116 36 V50 C70 64 40 46 4 58 Z", fill: k.light, opacity: 0.55 }, g);
      node("path", { d: "M4 72 C40 62 70 84 116 68 V80 C80 94 40 76 4 86 Z", fill: k.dark, opacity: 0.4 }, g);
      node("path", { d: "M4 22 C40 16 80 28 116 18 V26 C80 36 40 24 4 30 Z", fill: k.dark, opacity: 0.25 }, g);
    },
    earth: function (g, k) {
      node("path", { d: "M44 44 C56 38 72 44 74 56 C76 68 66 80 54 76 C46 73 48 64 42 58 C38 53 38 47 44 44 Z", fill: "#c9a27e", opacity: 0.9 }, g);
      node("path", { d: "M80 78 C88 74 98 78 96 86 C94 94 84 96 78 90 C75 86 76 80 80 78 Z", fill: "#c9a27e", opacity: 0.8 }, g);
      node("path", { d: "M8 38 C28 28 44 40 62 32 C76 26 90 32 104 26 C96 40 78 42 64 42 C44 46 28 40 8 38 Z", fill: k.light, opacity: 0.8 }, g);
      node("path", { d: "M14 84 C34 76 52 90 74 84 C66 96 44 98 30 94 C22 92 18 88 14 84 Z", fill: k.light, opacity: 0.7 }, g);
      node("path", { d: "M34 14 C48 8 72 8 86 14 C74 20 46 20 34 14 Z", fill: k.light, opacity: 0.85 }, g);
    },
    moon: function (g, k) {
      node("path", { d: "M34 34 C46 26 62 32 60 46 C58 56 42 58 34 52 C27 47 27 39 34 34 Z", fill: k.dark, opacity: 0.5 }, g);
      node("circle", { cx: 74, cy: 64, r: 12, fill: k.dark, opacity: 0.45 }, g);
      node("circle", { cx: 46, cy: 80, r: 7, fill: k.dark, opacity: 0.4 }, g);
      node("circle", { cx: 84, cy: 36, r: 4, fill: k.dark, opacity: 0.55 }, g);
      node("circle", { cx: 62, cy: 96, r: 3, fill: k.dark, opacity: 0.5 }, g);
    },
    mars: function (g, k) {
      node("path", { d: "M8 62 C30 52 52 68 74 58 C90 52 102 58 112 54 V68 C94 76 78 68 60 76 C40 82 24 70 8 74 Z", fill: k.dark, opacity: 0.5 }, g);
      node("path", { d: "M34 14 C48 7 72 7 86 14 C74 21 46 21 34 14 Z", fill: k.light, opacity: 0.9 }, g);
      node("circle", { cx: 78, cy: 88, r: 5, fill: k.dark, opacity: 0.4 }, g);
      node("circle", { cx: 38, cy: 40, r: 4, fill: k.dark, opacity: 0.35 }, g);
    },
    jupiter: function (g, k) {
      node("rect", { x: 0, y: 26, width: 120, height: 9, fill: k.dark, opacity: 0.45 }, g);
      node("rect", { x: 0, y: 41, width: 120, height: 6, fill: k.light, opacity: 0.5 }, g);
      node("rect", { x: 0, y: 53, width: 120, height: 13, fill: k.dark, opacity: 0.6 }, g);
      node("rect", { x: 0, y: 72, width: 120, height: 7, fill: k.light, opacity: 0.45 }, g);
      node("rect", { x: 0, y: 85, width: 120, height: 9, fill: k.dark, opacity: 0.4 }, g);
      node("ellipse", { cx: 78, cy: 64, rx: 10, ry: 6, fill: "#c8683c" }, g);
    },
    saturn: function (g, k) {
      node("rect", { x: 0, y: 30, width: 120, height: 9, fill: k.dark, opacity: 0.35 }, g);
      node("rect", { x: 0, y: 48, width: 120, height: 7, fill: k.light, opacity: 0.55 }, g);
      node("rect", { x: 0, y: 64, width: 120, height: 11, fill: k.dark, opacity: 0.3 }, g);
      node("rect", { x: 0, y: 86, width: 120, height: 8, fill: k.dark, opacity: 0.25 }, g);
    },
    uranus: function (g, k) {
      node("rect", { x: 0, y: 46, width: 120, height: 26, fill: k.light, opacity: 0.2 }, g);
      node("rect", { x: 0, y: 84, width: 120, height: 10, fill: k.dark, opacity: 0.35 }, g);
    },
    neptune: function (g, k) {
      node("rect", { x: 0, y: 34, width: 120, height: 8, fill: k.dark, opacity: 0.55 }, g);
      node("rect", { x: 0, y: 74, width: 120, height: 11, fill: k.dark, opacity: 0.5 }, g);
      node("ellipse", { cx: 46, cy: 60, rx: 10, ry: 6, fill: k.dark, opacity: 0.8 }, g);
      node("path", { d: "M58 50 C68 46 80 52 92 48", fill: "none", stroke: k.light, "stroke-width": 3, "stroke-linecap": "round", opacity: 0.75 }, g);
    },
  };

  function globe(world, parent) {
    var look = LOOKS[world.id];
    node("circle", { cx: 60, cy: 60, r: 52, fill: look.base }, parent);
    var inner = node("g", { "clip-path": "url(#gc-disc)" }, parent);
    FEATURES[world.id](inner, look);
    node("circle", { cx: 60, cy: 60, r: 52, fill: "url(#gc-light)" }, inner);
    // Filo del disco: invisible en oscuro; en claro sostiene a los mundos pálidos sobre el papel.
    node("circle", { class: "globe-rim", cx: 60, cy: 60, r: 52 }, parent);
  }

  // Disco del mundo. Devuelve { el, size, lift }: `lift` es la fracción del lado
  // que queda vacía sobre el polo norte, para poder apoyar al astronauta justo encima.
  function disc(world) {
    var look = LOOKS[world.id];

    if (world.id === "pluto") {
      var img = document.createElement("img");
      img.src = "assets/pluto.svg";
      img.alt = "";
      img.width = 120;
      img.height = 120;
      return { el: img, size: look.size, lift: 8 / 120 };
    }

    var svg = node("svg", { viewBox: "0 0 120 120", "aria-hidden": "true", focusable: "false" });

    if (world.id === "saturn") {
      // El globo se encoge para dejar sitio a los anillos: medio anillo detrás, medio delante.
      // Los anillos toman el color por clase (style.css): casi blancos, sobre papel se perderían.
      var ring = { class: "ring-saturn", fill: "none", "stroke-width": 5, opacity: 0.85 };
      var back = node("g", { transform: "rotate(-14 60 60)" }, svg);
      ring.d = "M4 60 A56 15 0 0 1 116 60";
      node("path", ring, back);
      globe(world, node("g", { transform: "translate(60 60) scale(0.68) translate(-60 -60)" }, svg));
      var front = node("g", { transform: "rotate(-14 60 60)" }, svg);
      ring.d = "M4 60 A56 15 0 0 0 116 60";
      node("path", ring, front);
      return { el: svg, size: look.size, lift: (60 - 52 * 0.68) / 120 };
    }

    if (world.id === "uranus") {
      // Anillo fino y casi vertical: Urano rueda tumbado.
      var thin = { class: "ring-uranus", fill: "none", "stroke-width": 1.6, opacity: 0.5 };
      thin.d = "M60 3 A10 57 0 0 0 60 117";
      node("path", thin, node("g", { transform: "rotate(12 60 60)" }, svg));
      globe(world, svg);
      thin.d = "M60 3 A10 57 0 0 1 60 117";
      node("path", thin, node("g", { transform: "rotate(12 60 60)" }, svg));
      return { el: svg, size: look.size, lift: 8 / 120 };
    }

    globe(world, svg);
    return { el: svg, size: look.size, lift: 8 / 120 };
  }

  /* ---------- suelo de la escena ---------- */

  // Radio en pantalla del horizonte: de muy curvo (Plutón) a casi plano (Júpiter).
  // Escala logarítmica, porque entre ambos hay un factor 59.
  function horizonRadius(world, width) {
    var t = Math.log(world.radius / 1188) / Math.log(69911 / 1188);
    return width * (0.8 + 4.5 * t);
  }

  // Pinta el limbo del mundo con su cima en (cx, gy). `geo.clip` es el círculo
  // del clipPath #gc-ground, que se ajusta al mismo limbo.
  function paintGround(layer, world, geo) {
    var look = LOOKS[world.id];
    var R = horizonRadius(world, geo.W);
    var cx = geo.cx;
    var cy = geo.gy + R;
    var depth = geo.H - geo.gy;
    var span = Math.asin(Math.min(1, geo.W / 2 / R)); // semiángulo visible
    var rand = window.Pluton.random(world.radius);

    clear(layer);
    geo.clip.setAttribute("cx", cx);
    geo.clip.setAttribute("cy", cy);
    geo.clip.setAttribute("r", R);

    node("circle", { cx: cx, cy: cy, r: R, fill: look.base }, layer);
    var inner = node("g", { "clip-path": "url(#gc-ground)" }, layer);

    // Mancha apoyada en la superficie: `angle` desde la vertical, `d` px bajo el suelo.
    function patch(angle, d, rx, ry, fill, opacity) {
      var x = cx + (R - d) * Math.sin(angle);
      var y = cy - (R - d) * Math.cos(angle);
      node(
        "ellipse",
        {
          cx: x.toFixed(1),
          cy: y.toFixed(1),
          rx: rx.toFixed(1),
          ry: ry.toFixed(1),
          fill: fill,
          opacity: opacity.toFixed(2),
          transform: "rotate(" + ((angle * 180) / Math.PI).toFixed(2) + " " + x.toFixed(1) + " " + y.toFixed(1) + ")",
        },
        inner
      );
    }

    // Franja que sigue la curvatura, a `d` px de profundidad.
    function stratum(d, thickness, fill, opacity) {
      node("circle", { cx: cx, cy: cy, r: (R - d - thickness / 2).toFixed(1), fill: "none", stroke: fill, "stroke-width": thickness.toFixed(1), opacity: opacity }, inner);
    }

    function craters(count, fill) {
      for (var i = 0; i < count; i++) {
        var rx = 9 + rand() * 26;
        patch((rand() * 2 - 1) * span * 0.96, 9 + rand() * (depth - 12), rx, rx * 0.3, fill, 0.28 + rand() * 0.3);
      }
    }

    if (look.ground === "bands") {
      stratum(depth * 0.12, depth * 0.16, look.light, 0.4);
      stratum(depth * 0.4, depth * 0.24, look.dark, 0.5);
      stratum(depth * 0.78, depth * 0.1, look.light, 0.22);
    } else if (look.ground === "craters") {
      craters(geo.W < 520 ? 6 : 10, look.dark);
    } else if (look.ground === "land") {
      // Tierra firme bajo los pies y un par de nubes sobre el océano.
      patch(0.004, depth * 0.2, geo.W * 0.2, depth * 0.62, "#c9a27e", 0.92);
      patch(-span * 0.62, 7, geo.W * 0.09, 5, look.light, 0.75);
      patch(span * 0.7, 16, geo.W * 0.07, 4.5, look.light, 0.7);
      patch(-span * 0.3, depth * 0.72, geo.W * 0.06, 4, look.light, 0.5);
    } else {
      // Plutón: el astronauta pisa Tombaugh Regio, el corazón claro.
      craters(geo.W < 520 ? 3 : 5, look.dark);
      patch(0.03, depth * 0.3, geo.W * 0.17, depth * 0.7, "#efe3d3", 1);
      patch(-0.03, depth * 0.16, geo.W * 0.085, depth * 0.36, "#fbf5ec", 0.6);
    }

    // Filo del horizonte: el modo claro lo vuelve una línea de tinta (.ground-rim en style.css).
    node("circle", { class: "ground-rim", cx: cx, cy: cy, r: R - 0.75, fill: "none", stroke: look.light, "stroke-width": 1.5, opacity: 0.5 }, layer);
    // El suelo se funde con el fondo hacia abajo: es un horizonte, no una caja.
    node("rect", { x: 0, y: geo.gy, width: geo.W, height: depth, fill: "url(#gc-fade)", "clip-path": "url(#gc-ground)" }, layer);
  }

  App.worlds = {
    node: node,
    clear: clear,
    disc: disc,
    paintGround: paintGround,
  };
})();
