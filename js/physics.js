/* Física del salto y datos de los mundos. Sin DOM: se puede probar con Node.
   Modelo: las piernas dan el mismo impulso en todas partes, así que la velocidad
   de despegue es la de la Tierra, v0 = √(2·g_T·h_T). Con ella, en cada mundo:
     altura  h = v0² / (2g)          tiempo en el aire  t = 2·v0 / g
     peso    = masa · g / g_T (kgf)  fuerza             = masa · g (N)          */
(function () {
  "use strict";

  var App = (window.GravityCheck = window.GravityCheck || {});

  var G_EARTH = 9.81;

  // g en m/s² (en los gigantes, al nivel de 1 bar) y radio medio en km.
  var WORLDS = [
    { id: "mercury", name: "Mercurio", g: 3.7, radius: 2440, tag: "planeta rocoso" },
    { id: "venus", name: "Venus", g: 8.87, radius: 6052, tag: "planeta rocoso" },
    { id: "earth", name: "Tierra", g: 9.81, radius: 6371, tag: "tu referencia" },
    { id: "moon", name: "Luna", g: 1.62, radius: 1737, tag: "satélite de la Tierra" },
    { id: "mars", name: "Marte", g: 3.72, radius: 3390, tag: "planeta rocoso" },
    { id: "jupiter", name: "Júpiter", g: 24.79, radius: 69911, tag: "gigante gaseoso · g en la cima de las nubes" },
    { id: "saturn", name: "Saturno", g: 10.44, radius: 58232, tag: "gigante gaseoso · g en la cima de las nubes" },
    { id: "uranus", name: "Urano", g: 8.87, radius: 25362, tag: "gigante helado · g en la cima de las nubes" },
    { id: "neptune", name: "Neptuno", g: 11.15, radius: 24622, tag: "gigante helado · g en la cima de las nubes" },
    { id: "pluto", name: "Plutón", g: 0.62, radius: 1188, tag: "planeta enano" },
  ];

  var LIMITS = {
    mass: { min: 1, max: 300, initial: 70 }, // kg
    jump: { min: 5, max: 150, initial: 50 }, // cm
  };

  // Tiempos del ciclo en ms. Solo la duración del vuelo depende del mundo.
  var PREP = 420;
  var LAND = 520;
  var REST = 700;
  var PUSH_AT = 0.68; // fracción de PREP en que acaba la flexión y empieza el empuje
  var ABSORB = 0.28; // fracción de LAND que dura la amortiguación

  function jumpOn(world, mass, earthHeight) {
    var v0 = Math.sqrt(2 * G_EARTH * earthHeight);
    return {
      g: world.g,
      v0: v0,
      height: (v0 * v0) / (2 * world.g),
      time: (2 * v0) / world.g,
      kgf: (mass * world.g) / G_EARTH,
      newtons: mass * world.g,
      ratio: world.g / G_EARTH,
    };
  }

  function compute(mass, jumpCm) {
    var earthHeight = jumpCm / 100;
    return {
      v0: Math.sqrt(2 * G_EARTH * earthHeight),
      earthHeight: earthHeight,
      jumps: WORLDS.map(function (world) {
        return jumpOn(world, mass, earthHeight);
      }),
    };
  }

  /* ---------- pose en un instante ---------- */

  function easeIn(p) {
    return p * p * p;
  }

  function easeOut(p) {
    return 1 - Math.pow(1 - p, 3);
  }

  function easeInOut(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }

  function easeOutBack(p) {
    var c = 1.70158;
    return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
  }

  function cycleOf(jump) {
    return PREP + jump.time * 1000 + LAND + REST;
  }

  // Estado del astronauta `tau` ms después de empezar a saltar en bucle.
  //   y: metros sobre el suelo · crouch: flexión de piernas (0–1, algo negativo en el rebote)
  //   air: brazos arriba (0–1) · t: segundos de vuelo transcurridos
  // El vuelo es física pura; el easing solo vive en la flexión y el aterrizaje.
  function pose(jump, tau) {
    var flight = jump.time * 1000;
    var out = { phase: "rest", y: 0, crouch: 0, air: 0, t: 0 };
    if (tau < 0) return out;
    var t = tau % cycleOf(jump);

    if (t < PREP) {
      var p = t / PREP;
      out.phase = "prep";
      out.crouch = p < PUSH_AT ? easeInOut(p / PUSH_AT) : 1 - easeIn((p - PUSH_AT) / (1 - PUSH_AT));
    } else if (t < PREP + flight) {
      var s = (t - PREP) / 1000;
      out.phase = "flight";
      out.t = s;
      out.y = Math.max(0, jump.v0 * s - 0.5 * jump.g * s * s);
      out.air = easeOut(Math.min(1, (t - PREP) / 260)) * easeInOut(Math.min(1, (PREP + flight - t) / 220));
    } else if (t < PREP + flight + LAND) {
      var q = (t - PREP - flight) / LAND;
      out.phase = "land";
      out.t = jump.time;
      out.crouch = 0.85 * (q < ABSORB ? easeOut(q / ABSORB) : 1 - easeOutBack((q - ABSORB) / (1 - ABSORB)));
    } else {
      out.t = jump.time;
    }
    return out;
  }

  // Pose fija para movimiento reducido: el punto más alto del salto.
  function apex(jump) {
    return { phase: "apex", y: jump.height, crouch: 0, air: 1, t: jump.time / 2 };
  }

  /* ---------- entrada y formato ---------- */

  // Valida un campo numérico. Acepta coma o punto decimal.
  function check(text, limit) {
    var raw = String(text == null ? "" : text).trim().replace(",", ".");
    if (raw === "") return { ok: false, why: "empty" };
    var value = Number(raw);
    if (!isFinite(value)) return { ok: false, why: "nan" };
    if (value < limit.min) return { ok: false, why: "low", value: limit.min };
    if (value > limit.max) return { ok: false, why: "high", value: limit.max };
    return { ok: true, value: Math.round(value * 10) / 10 };
  }

  // Número con coma decimal.
  function fmt(value, decimals) {
    var text = value.toFixed(decimals);
    if (parseFloat(text) === 0) text = text.replace("-", "");
    return text.replace(".", ",");
  }

  // Igual, pero sin ceros de relleno: 70 → "70", 72.5 → "72,5".
  function fmtShort(value) {
    return String(Math.round(value * 10) / 10).replace(".", ",");
  }

  // Paso "redondo" para una regla que cubre `span` metros con pocas marcas.
  function niceStep(span, maxTicks) {
    var steps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
    for (var i = 0; i < steps.length; i++) {
      if (span / steps[i] <= maxTicks) return steps[i];
    }
    return 100;
  }

  App.physics = {
    G_EARTH: G_EARTH,
    WORLDS: WORLDS,
    LIMITS: LIMITS,
    TIMING: { prep: PREP, land: LAND, rest: REST },
    compute: compute,
    cycleOf: cycleOf,
    pose: pose,
    apex: apex,
    check: check,
    fmt: fmt,
    fmtShort: fmtShort,
    niceStep: niceStep,
  };
})();
