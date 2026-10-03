/* Panel de datos: entradas con validación, telemetría del mundo elegido,
   la tira de mundos como grupo de opciones y la persistencia. */
(function () {
  "use strict";

  var App = window.GravityCheck;
  var physics = App.physics;
  var WORLDS = physics.WORLDS;
  var LIMITS = physics.LIMITS;
  var fmt = physics.fmt;
  var STORE_KEY = "gravity-check:v1";
  var DEFAULT_HINT = "peso de 1 a 300 kg · salto de 5 a 150 cm";

  var FIELDS = {
    mass: { input: document.getElementById("mass"), limit: LIMITS.mass, label: "peso", noun: "el peso", unit: "kg" },
    jump: { input: document.getElementById("jump"), limit: LIMITS.jump, label: "salto", noun: "el salto", unit: "cm" },
  };

  var els = {
    status: document.getElementById("status"),
    hint: document.getElementById("hint"),
    announce: document.getElementById("announce"),
    form: document.getElementById("fields"),
    worlds: document.getElementById("worlds"),
    sync: document.getElementById("sync"),
    stripLabel: document.getElementById("strip-label"),
    stageDesc: document.getElementById("stage-desc"),
    hudWorld: document.getElementById("hud-world"),
    disc: document.getElementById("t-disc"),
    world: document.getElementById("t-world"),
    tag: document.getElementById("t-tag"),
    g: document.getElementById("t-g"),
    ratio: document.getElementById("t-ratio"),
    height: document.getElementById("t-height"),
    times: document.getElementById("t-times"),
    time: document.getElementById("t-time"),
    weight: document.getElementById("t-weight"),
    force: document.getElementById("t-force"),
    mass: document.getElementById("t-mass"),
  };

  var state = { mass: LIMITS.mass.initial, jump: LIMITS.jump.initial, world: "pluto" };
  var invalid = { mass: false, jump: false };
  var announceTimer = 0;
  var ready = false; // hasta que la página arranca no se anuncia nada

  /* ---------- persistencia ---------- */

  function load() {
    try {
      var data = JSON.parse(window.localStorage.getItem(STORE_KEY) || "null");
      if (!data || typeof data !== "object") return;
      var mass = physics.check(data.mass, LIMITS.mass);
      var jump = physics.check(data.jump, LIMITS.jump);
      if (mass.ok) state.mass = mass.value;
      if (jump.ok) state.jump = jump.value;
      if (indexOf(data.world) !== -1) state.world = data.world;
    } catch (err) {
      /* sin almacenamiento o dato corrupto: valen los valores iniciales */
    }
  }

  function save() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      /* almacenamiento no disponible: la página sigue funcionando */
    }
  }

  function indexOf(id) {
    for (var i = 0; i < WORLDS.length; i++) {
      if (WORLDS[i].id === id) return i;
    }
    return -1;
  }

  /* ---------- tira de mundos ---------- */

  function span(cls, parent) {
    var el = document.createElement("span");
    el.className = cls;
    parent.appendChild(el);
    return el;
  }

  function mountDisc(host, world) {
    var disc = App.worlds.disc(world);
    host.style.setProperty("--d", disc.size + "px");
    host.style.setProperty("--lift", disc.lift.toFixed(4));
    host.appendChild(disc.el);
  }

  var astro = document.getElementById("astro");

  var columns = WORLDS.map(function (world) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "world";
    button.setAttribute("role", "radio");
    button.dataset.world = world.id;

    var sky = span("world-sky", button);
    var apex = span("world-apex", sky);
    var jumper = span("world-jumper", sky);
    var mini = astro.cloneNode(true);
    mini.removeAttribute("id");
    jumper.appendChild(mini);

    mountDisc(span("world-disc", button), world);
    span("world-name", button).textContent = world.name;
    var height = span("world-h mono", button);
    var weight = span("world-w mono", button);

    els.worlds.appendChild(button);
    return { button: button, sky: sky, apex: apex, jumper: jumper, height: height, weight: weight };
  });

  /* ---------- vista ---------- */

  function setStatus(label, text, isError) {
    els.status.innerHTML = "";
    els.status.append(label + ": ");
    var strong = document.createElement("b");
    strong.textContent = text;
    els.status.appendChild(strong);
    els.status.classList.toggle("is-error", Boolean(isError));
  }

  function setHint(text, isError) {
    if (els.hint.textContent !== text) els.hint.textContent = text;
    els.hint.classList.toggle("is-error", Boolean(isError));
  }

  function newtons(value) {
    return fmt(value, value >= 1000 ? 0 : 1) + " N";
  }

  function render(fade) {
    var result = physics.compute(state.mass, state.jump);
    var index = indexOf(state.world);
    var world = WORLDS[index];
    var jump = result.jumps[index];
    var still = window.Pluton.reducedMotion();

    columns.forEach(function (column, i) {
      var other = result.jumps[i];
      var chosen = i === index;
      column.height.textContent = fmt(other.height, 2) + " m";
      column.weight.textContent = fmt(other.kgf, 1) + " kgf";
      column.button.setAttribute("aria-checked", chosen ? "true" : "false");
      column.button.tabIndex = chosen ? 0 : -1;
      column.button.setAttribute(
        "aria-label",
        WORLDS[i].name + ": salto de " + fmt(other.height, 2) + " metros, " + fmt(other.time, 2) + " segundos en el aire, peso de " + fmt(other.kgf, 1) + " kilogramos-fuerza"
      );
    });

    if (els.world.textContent !== world.name || !els.disc.firstChild) {
      els.world.textContent = world.name;
      els.tag.textContent = world.tag;
      els.hudWorld.textContent = world.name;
      App.worlds.clear(els.disc);
      mountDisc(els.disc, world);
    }
    els.g.textContent = fmt(jump.g, 2) + " m/s²";
    els.ratio.textContent = fmt(jump.ratio, 2) + " g";
    els.height.textContent = fmt(jump.height, 2) + " m";
    els.times.textContent = "×" + fmt(1 / jump.ratio, jump.ratio > 1 ? 2 : 1);
    els.time.textContent = fmt(jump.time, 2) + " s";
    els.weight.textContent = fmt(jump.kgf, 1) + " kgf";
    els.force.textContent = newtons(jump.newtons);
    els.mass.textContent = physics.fmtShort(state.mass) + " kg";
    document.getElementById("v0").textContent = fmt(result.v0, 2) + " m/s";

    var summary = world.name + ": saltas " + fmt(jump.height, 2) + " m, pasas " + fmt(jump.time, 2) + " s en el aire y pesas " + fmt(jump.kgf, 1) + " kgf.";
    els.stageDesc.textContent = "Un astronauta salta en " + world.name + " junto a una regla en metros. " + summary;
    if (!invalid.mass && !invalid.jump) {
      setStatus("status", (still ? "en lo más alto · " : "saltando en ") + world.name + (still ? "" : " · " + fmt(jump.height, 2) + " m"));
    }

    // Al teclear, el lector de pantalla oye el resultado final y no cada pulsación.
    window.clearTimeout(announceTimer);
    if (ready) {
      announceTimer = window.setTimeout(function () {
        els.announce.textContent = summary;
      }, 500);
    }

    scene.update({ jumps: result.jumps, index: index, earthHeight: result.earthHeight }, Boolean(fade));
  }

  function renderMotion(still) {
    els.sync.hidden = still;
    els.stripLabel.firstChild.textContent = still ? "cada astronauta en lo más alto de su salto · despegue a " : "misma escala · despegue a ";
  }

  /* ---------- entradas ---------- */

  function explain(field, why) {
    if (why === "empty" || why === "nan") return "escribe " + field.noun + " en " + field.unit;
    return field.noun + " va de " + field.limit.min + " a " + field.limit.max + " " + field.unit;
  }

  function refreshErrors() {
    var first = invalid.mass ? "mass" : invalid.jump ? "jump" : null;
    if (!first) {
      setHint(DEFAULT_HINT, false);
      return;
    }
    setHint(explain(FIELDS[first], invalid[first]), true);
    setStatus("error", "revisa " + FIELDS[first].noun, true);
  }

  // Mientras se escribe: si el valor vale se aplica al momento; si no, se avisa
  // sin tocar lo escrito y la escena conserva el último dato bueno.
  function onInput(name) {
    var field = FIELDS[name];
    var result = physics.check(field.input.value, field.limit);
    invalid[name] = result.ok ? false : result.why;
    field.input.setAttribute("aria-invalid", result.ok ? "false" : "true");
    if (result.ok) {
      state[name] = result.value;
      save();
      render(false);
    }
    refreshErrors();
  }

  // Al salir del campo: un valor fuera de rango se lleva al límite más cercano
  // y uno vacío recupera el anterior.
  function onCommit(name) {
    var field = FIELDS[name];
    var result = physics.check(field.input.value, field.limit);
    var adjusted = !result.ok && (result.why === "low" || result.why === "high");
    if (adjusted) state[name] = result.value;
    field.input.value = String(state[name]);
    field.input.setAttribute("aria-invalid", "false");
    invalid[name] = false;
    if (adjusted) save();
    if (!result.ok) render(false);
    refreshErrors();
    if (adjusted && !invalid.mass && !invalid.jump) {
      setHint(field.label + " ajustado a " + physics.fmtShort(state[name]) + " " + field.unit, false);
    }
  }

  Object.keys(FIELDS).forEach(function (name) {
    FIELDS[name].input.addEventListener("input", function () {
      onInput(name);
    });
    FIELDS[name].input.addEventListener("change", function () {
      onCommit(name);
    });
  });

  els.form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  /* ---------- selección de mundo ---------- */

  function select(index, focus) {
    var world = WORLDS[index];
    if (focus) columns[index].button.focus();
    if (world.id === state.world) {
      scene.sync();
      return;
    }
    state.world = world.id;
    save();
    render(true);
  }

  function columnOf(target) {
    var button = target instanceof Element ? target.closest(".world") : null;
    return button ? indexOf(button.dataset.world) : -1;
  }

  els.worlds.addEventListener("click", function (event) {
    var index = columnOf(event.target);
    if (index !== -1) select(index, false);
  });

  // Grupo de opciones: las flechas mueven el foco y eligen, como en un radio nativo.
  els.worlds.addEventListener("keydown", function (event) {
    var index = columnOf(event.target);
    if (index === -1 || event.ctrlKey || event.metaKey || event.altKey) return;
    var count = WORLDS.length;
    var next;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % count;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + count) % count;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    else return;
    event.preventDefault();
    select(next, true);
  });

  els.sync.addEventListener("click", function () {
    scene.sync();
  });

  /* ---------- arranque ---------- */

  var scene = App.createScene({
    stage: document.getElementById("stage"),
    strip: els.worlds,
    grid: document.getElementById("worlds-grid"),
    columns: columns,
    hudT: document.getElementById("hud-t"),
    hudY: document.getElementById("hud-y"),
    onMotionChange: function (still) {
      renderMotion(still);
      render(false);
    },
  });

  load();
  FIELDS.mass.input.value = String(state.mass);
  FIELDS.jump.input.value = String(state.jump);
  renderMotion(window.Pluton.reducedMotion());
  render(false);
  ready = true;
})();
