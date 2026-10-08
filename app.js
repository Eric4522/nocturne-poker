/* Presentation only. The engine never depends on the DOM, timers or animations. */
(function () {
  "use strict";
  const C = window.PokerCards,
    { Engine, PROFILES, potLayers } = window.PokerEngine,
    AI = window.PokerAI;
  const $ = (id) => document.getElementById(id);
  const fmt = (n) =>
    Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const DIFFICULTIES = { easy: "Fácil", normal: "Normal", hard: "Difícil" };
  const STREETS = ["preflop", "flop", "turn", "river"];
  const suitNames = {
    s: "picas",
    h: "corazones",
    d: "diamantes",
    c: "tréboles",
  };
  const defaults = {
    difficulty: "normal",
    sound: true,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    speed: "natural",
  };
  const emptyStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    handsPlayed: 0,
    handsWon: 0,
    biggestPot: 0,
    chipsWon: 0,
  };
  let storageAvailable = true;
  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object"
        ? { ...fallback, ...value }
        : { ...fallback };
    } catch (_) {
      return { ...fallback };
    }
  }
  const settings = read("nocturne.settings.v1", defaults),
    stats = read("nocturne.stats.v1", emptyStats);
  if (!DIFFICULTIES[settings.difficulty]) settings.difficulty = "normal";
  if (!["natural", "fast"].includes(settings.speed)) settings.speed = "natural";
  settings.sound = settings.sound === true;
  settings.reducedMotion = settings.reducedMotion === true;
  for (const key of Object.keys(emptyStats))
    if (!Number.isSafeInteger(stats[key]) || stats[key] < 0) stats[key] = 0;
  let engine = null,
    timer = null,
    ticket = 0,
    paused = false,
    dealing = false,
    lobbyVisible = true;
  let networkMode = false, networkAvailable = false, networkPending = false, networkEpoch = null, networkVersion = null;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  let resumeAfterPanel = false,
    recordedHand = 0,
    outcomeRecorded = false,
    displayedPot = 0,
    potFrame = null,
    activePanel = null;
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      if (storageAvailable)
        toast("El navegador no permite guardar datos locales.");
      storageAvailable = false;
    }
  }
  function toast(message) {
    $("toast").textContent = message;
    $("toast").hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      $("toast").hidden = true;
    }, 3500);
  }
  function sound(type) { window.PokerSound?.setEnabled(settings.sound); return window.PokerSound?.play(type); }
  function unlockSound() { window.PokerSound?.setEnabled(settings.sound); if(settings.sound) window.PokerSound?.unlock(); }
  document.addEventListener('pointerdown',unlockSound,{capture:true});
  document.addEventListener('keydown',unlockSound,{capture:true});
  function applySettings() {
    window.PokerSound?.setEnabled(settings.sound);
    $('quick-sound').textContent=settings.sound?'Probar sonido ♫':'Activar sonido ♫';
    document.body.classList.toggle("reduced-motion", settings.reducedMotion);
    $("lobby-difficulty").textContent = DIFFICULTIES[settings.difficulty];
    $("game-difficulty").textContent =
      DIFFICULTIES[settings.difficulty].toUpperCase();
    document.querySelectorAll(".sound-button").forEach((button) => {
      button.innerHTML = `<svg><use href="#i-${settings.sound ? "sound" : "mute"}"/></svg>`;
      button.setAttribute(
        "aria-label",
        settings.sound ? "Desactivar sonido" : "Activar sonido",
      );
      button.setAttribute("aria-pressed", String(settings.sound));
    });
    save("nocturne.settings.v1", settings);
  }
  function cancelScheduled() {
    clearTimeout(timer);
    timer = null;
    ticket++;
  }
  function schedule(fn, delay) {
    clearTimeout(timer);
    const mine = ++ticket;
    timer = setTimeout(() => {
      timer = null;
      if (
        mine === ticket &&
        !paused &&
        !lobbyVisible &&
        !$("panel-dialog").open
      )
        fn();
    }, delay);
  }
  function createSeats() {
    $("seats").innerHTML = PROFILES.map(
      (p, id) =>
        `<div class="seat seat-${id}" id="seat-${id}"><div class="seat-avatar">${p.initials}</div><div class="nameplate"><span class="seat-name">${p.name}</span><strong class="seat-stack">1.000</strong><span class="dealer-token" hidden>D</span></div><span class="seat-profile">${p.label}</span><div class="hole-cards" aria-label="Cartas de ${p.name}"></div><span class="seat-action"></span><div class="seat-bet" hidden><i class="chip"></i><span></span></div></div>`,
    ).join("");
  }
  function cardNode(card, faceDown) {
    const node = document.createElement("div");
    node.className = "card";
    node.dataset.key = card.id;
    if (card.hidden) {
      node.innerHTML = `<div class="card-inner"><div class="card-front"></div><div class="card-back"><span>N</span></div></div>`;
      node.classList.add("face-down"); return node;
    }
    const label = C.rankLabel(card.rank),
      symbol = C.SYMBOLS[card.suit];
    const red = ["h", "d"].includes(card.suit);
    const pips =
      card.rank >= 11
        ? `<div class="card-pips court">${{ 11: "♙", 12: "♕", 13: "♛", 14: symbol }[card.rank]}<span>${symbol}</span></div>`
        : `<div class="card-pips pips-${card.rank}">${Array.from({ length: card.rank }, () => `<span>${symbol}</span>`).join("")}</div>`;
    // Aces have a full-size suit rather than a court illustration.
    const center =
      card.rank === 14
        ? `<div class="card-pips big-pip">${symbol}</div>`
        : pips;
    node.innerHTML = `<div class="card-inner"><div class="card-front${red ? " red" : ""}"><span class="card-corner">${label}<small>${symbol}</small></span>${center}<span class="card-corner bottom">${label}<small>${symbol}</small></span></div><div class="card-back"><span>N</span></div></div>`;
    node.classList.toggle("face-down", faceDown);
    return node;
  }
  function renderCards(
    container,
    list,
    faceDown,
    wins = new Set(),
    deal = false,
    offset = 0,
  ) {
    const existing = new Map(
      [...container.children].map((node) => [node.dataset.key, node]),
    );
    const keys = new Set(list.map((c, i) => c?.id || `slot-${i}`));
    for (const node of [...container.children])
      if (!keys.has(node.dataset.key)) node.remove();
    list.forEach((card, i) => {
      if (!card) {
        const key = `slot-${i}`;
        let slot = container.querySelector(`[data-key="${key}"]`);
        if (!slot) {
          slot = document.createElement("div");
          slot.className = "card slot";
          slot.dataset.key = key;
          slot.textContent = "♠";
          slot.setAttribute("aria-hidden", "true");
        }
        container.append(slot);
        return;
      }
      let node = existing.get(card.id);
      const isNew = !node;
      if (!node) {
        node = cardNode(card, faceDown || container.id === "board");
        container.append(node);
      } else container.append(node);
      node.classList.toggle("winning", wins.has(card.id));
      node.querySelector(".card-front").setAttribute("aria-hidden", "true");
      node.querySelector(".card-back").setAttribute("aria-hidden", "true");
      node.setAttribute("role", "img");
      node.setAttribute(
        "aria-label",
        faceDown
          ? "Carta oculta"
          : `${C.rankLabel(card.rank)} de ${suitNames[card.suit]}`,
      );
      if (isNew && deal && !settings.reducedMotion) {
        const deck = $("deck-box").getBoundingClientRect(),
          rect = node.getBoundingClientRect();
        node.style.setProperty("--dx", `${deck.left - rect.left}px`);
        node.style.setProperty("--dy", `${deck.top - rect.top}px`);
        node.style.setProperty("--delay", `${offset + i * 75}ms`);
        node.classList.add("new-card");
        setTimeout(
          () => node.classList.remove("new-card"),
          offset + i * 75 + 700,
        );
      }
      if (isNew && container.id === "board" && !faceDown)
        setTimeout(
          () => node.classList.remove("face-down"),
          settings.reducedMotion ? 0 : 120 + i * 90,
        );
      else node.classList.toggle("face-down", faceDown);
    });
  }
  function animatePot(value) {
    cancelAnimationFrame(potFrame);
    const startValue = displayedPot,
      start = performance.now(),
      duration = settings.reducedMotion ? 0 : 450;
    function tick(now) {
      const progress = duration ? Math.min(1, (now - start) / duration) : 1;
      displayedPot =
        startValue + (value - startValue) * (1 - (1 - progress) ** 3);
      $("pot-value").textContent = fmt(displayedPot);
      if (progress < 1) potFrame = requestAnimationFrame(tick);
    }
    potFrame = requestAnimationFrame(tick);
  }
  function flyChips(id, amount, allin = false) {
    if (amount <= 0) return;
    sound(allin ? "allin" : "chip");
    if (allin) {
      const seat = $(`seat-${id}`);
      seat.classList.remove("allin-glow");
      void seat.offsetWidth;
      seat.classList.add("allin-glow");
    }
    if (settings.reducedMotion) return;
    const seat = $(`seat-${id}`),
      scene = $("table-scene").getBoundingClientRect(),
      rect = seat.getBoundingClientRect();
    const chips = document.createElement("div");
    chips.className = "flying-chips";
    chips.style.left = `${rect.left + rect.width / 2 - scene.left}px`;
    chips.style.top = `${rect.top + rect.height / 2 - scene.top}px`;
    chips.innerHTML = `<i class="chip"></i><i class="chip ${amount >= 100 ? "chip-gold" : "chip-red"}"></i><i class="chip"></i>`;
    $("motion-layer").append(chips);
    setTimeout(() => chips.remove(), 750);
  }
  function renderHistory() {
    const events = engine.history
      .filter((e) => e.hand === engine.handNumber)
      .slice(-12);
    const list = $("action-history");
    list.innerHTML = "";
    for (const e of events) {
      const li = document.createElement("li");
      if (e.type === "hand" || e.type === "board") {
        li.className = "street-event";
        li.textContent = e.text.toUpperCase();
      } else {
        const name = document.createElement("span");
        name.className = "history-name";
        name.textContent = e.id === null ? "Mesa" : engine.players[e.id].name;
        const action = document.createElement("span");
        action.className = `history-action ${e.type}`;
        action.textContent = e.text;
        li.append(name, action);
      }
      list.append(li);
    }
    list.scrollTop = list.scrollHeight;
  }
  function render({ deal = false } = {}) {
    if (!engine) return;
    const completed = engine.phase === "complete",
      hero = engine.players[0],
      result = engine.result;
    const winningIds = new Set(result?.pots.flatMap((p) => p.winners) || []);
    const winningCards = new Set();
    if (result?.showdown)
      winningIds.forEach((id) =>
        result.hands[id]?.cards.forEach((c) => winningCards.add(c.id)),
      );
    engine.players.forEach((p) => {
      const seat = $(`seat-${p.id}`);
      if (networkMode) {
        const occupied=engine.players.filter(player => player.label !== 'Libre');
        const positions={2:[0,3],3:[0,2,4],4:[0,1,3,5],5:[0,1,2,4,5],6:[0,1,2,3,4,5]};
        const position=(positions[occupied.length]||[0])[occupied.findIndex(player => player.id===p.id)];
        seat.dataset.position=String(position);
        const coords=[[50,84],[13,69],[13,26],[50,9],[87,26],[87,69]][position];
        if(coords) { seat.style.setProperty('--x',coords[0]+'%'); seat.style.setProperty('--y',coords[1]+'%'); }
      }
      seat.querySelector(".seat-name").textContent = p.name;
      seat.querySelector(".seat-name").title = p.name;
      seat.querySelector(".seat-avatar").textContent = p.initials;
      seat.querySelector(".seat-profile").textContent = p.label;
      seat.hidden = networkMode && p.label === "Libre";
      seat.classList.toggle(
        "active",
        engine.actor === p.id && !paused && !dealing,
      );
      seat.classList.toggle("folded", p.folded && !p.eliminated);
      seat.classList.toggle("eliminated", p.eliminated);
      seat.classList.toggle("winner", completed && winningIds.has(p.id));
      seat.querySelector(".seat-stack").textContent = fmt(p.stack);
      seat.querySelector(".dealer-token").hidden = p.id !== engine.dealer;
      const act = seat.querySelector(".seat-action");
      if (p.id === engine.actor && p.id !== 0 && !paused && !dealing)
        act.innerHTML =
          '<span class="thinking-dots" aria-label="Pensando"><i></i><i></i><i></i></span>';
      else act.textContent = p.eliminated ? "Eliminado" : p.lastAction;
      act.classList.toggle("allin", p.lastAction.startsWith("All-in"));
      const bet = seat.querySelector(".seat-bet");
      bet.hidden = p.bet === 0 || completed;
      bet.querySelector("span").textContent = fmt(p.bet);
      const visible = p.id === 0 || (completed && result.showdown && !p.folded);
      const order = (p.id - engine.dealer - 1 + 6) % 6;
      renderCards(
        seat.querySelector(".hole-cards"),
        p.cards,
        !visible,
        winningCards,
        deal,
        order * 85,
      );
    });
    renderCards(
      $("board"),
      [...engine.board, ...Array(5 - engine.board.length).fill(null)],
      false,
      winningCards,
      false,
    );
    animatePot(completed ? result.pot : engine.pot);
    $("pot-label").textContent = completed ? "BOTE REPARTIDO" : "BOTE TOTAL";
    const layers = completed ? result.pots : potLayers(engine.players);
    const largestContribution = Math.max(...engine.players.map((p) => p.total));
    const secondaryCount = completed
      ? result.pots.length - 1
      : new Set(
          engine.live
            .filter(
              (p) =>
                p.stack === 0 && p.total > 0 && p.total < largestContribution,
            )
            .map((p) => p.total),
        ).size;
    $("side-pots").textContent =
      secondaryCount > 0
        ? `${secondaryCount} ${secondaryCount === 1 ? "bote secundario" : "botes secundarios"}`
        : "";
    $("hand-number").textContent =
      `MANO ${String(engine.handNumber).padStart(2, "0")}`;
    $("street-badge").textContent = completed
      ? result.showdown
        ? "SHOWDOWN"
        : "MANO RESUELTA"
      : engine.street.toUpperCase();
    [...$("street-timeline").querySelectorAll("span")].forEach((span, i) => {
      span.classList.toggle("current", i === STREETS.indexOf(engine.street));
      span.classList.toggle("done", i < STREETS.indexOf(engine.street));
    });
    $("hero-stack").innerHTML = `${fmt(hero.stack)} <small>FICHAS</small>`;
    $("stack-meter").style.width = `${(hero.stack / 6000) * 100}%`;
    $("remaining-players").textContent =
      `${engine.players.filter((p) => !p.eliminated).length} jugadores en la mesa`;
    $("hero-hand-label").textContent =
      engine.board.length >= 3 && hero.cards.length === 2 && !hero.folded
        ? `Tu mano: ${C.evaluate([...hero.cards, ...engine.board]).name}`
        : "Tus cartas privadas";
    $("paused-overlay").hidden =
      !paused || lobbyVisible || $("panel-dialog").open;
    $("pause-button").innerHTML =
      `<svg><use href="#i-${paused ? "play" : "pause"}"/></svg>`;
    $("pause-button").setAttribute(
      "aria-label",
      paused ? "Continuar partida" : "Pausar partida",
    );
    $("action-console").hidden = completed;
    $("result-panel").hidden = !completed;
    renderControls();
    renderHistory();
    if (completed) renderResult();
    $("pause-button").hidden = networkMode;
    $("lobby-button").hidden = networkMode;
    $("game-difficulty").textContent = networkMode ? "CON AMIGOS" : DIFFICULTIES[settings.difficulty].toUpperCase();
    const status = paused
      ? "Partida en pausa."
      : dealing
        ? "Repartiendo cartas…"
        : engine.phase === "transition"
          ? "Se cierra la ronda. La siguiente carta está en camino."
          : completed
            ? "Mano terminada. Puedes consultar el reparto."
            : engine.actor === 0
              ? "Tu turno. Elige tu jugada."
              : `${engine.players[engine.actor]?.name || "La mesa"} está pensando…`;
    $("status-message").textContent = status;
  }
  function renderControls() {
    const l = engine.legalActions(0),
      available =
        engine.actor === 0 &&
        engine.phase === "betting" &&
        !dealing &&
        !paused &&
        !lobbyVisible &&
        !$("panel-dialog").open && (!networkMode || (networkAvailable && !networkPending));
    for (const type of ["fold", "check", "call", "raise", "allin"])
      $(`action-${type}`).disabled = !available || !l[type];
    $("action-check").hidden = available && l.call;
    $("action-call").hidden = !l.call;
    $("call-value").innerHTML = `${fmt(l.callAmount)} <small>fichas</small>`;
    $("call-button-value").textContent =
      `${fmt(l.callAmount)} fichas${l.callAmount < l.toCall ? " · all-in" : ""}`;
    $("allin-value").textContent = `${fmt(engine.players[0].stack)} fichas`;
    $("action-allin").title =
      available && !l.allin
        ? "No se puede subir: apuesta no reabierta o rivales all-in."
        : "Apostar todas tus fichas disponibles";
    $("turn-label").textContent = paused
      ? "PARTIDA EN PAUSA"
      : dealing
        ? "REPARTIENDO"
        : available
          ? "TU TURNO"
          : "LA MESA JUEGA";
    $("turn-description").textContent = paused
      ? "Continúa cuando estés listo."
      : dealing
        ? "Cada carta cuenta."
        : available
          ? l.toCall
            ? "Iguala, sube o guarda tus fichas."
            : "Puedes pasar o tomar la iniciativa."
          : engine.players[0].folded
            ? "Te retiraste. Observa cómo termina la mano."
            : `${engine.players[engine.actor]?.name || "La mesa"} prepara su jugada.`;
    const slider = $("raise-slider");
    if (available && l.raise) {
      const previous = Number(slider.value);
      slider.min = l.minTotal;
      slider.max = l.maxTotal;
      slider.value = Math.max(l.minTotal, Math.min(l.maxTotal, previous));
      slider.disabled = false;
    } else slider.disabled = true;
    $("raise-controls").style.opacity = available && l.raise ? "1" : ".35";
    document.querySelectorAll("[data-size]").forEach((b) => {
      b.disabled = !available || !l.raise;
    });
    updateRaise();
  }
  function updateRaise() {
    const slider = $("raise-slider"),
      value = Number(slider.value);
    $("raise-value").textContent = fmt(value);
    $("raise-button-value").textContent = `a ${fmt(value)}`;
    const fill =
      Number(slider.max) === Number(slider.min)
        ? 100
        : ((value - Number(slider.min)) /
            (Number(slider.max) - Number(slider.min))) *
          100;
    slider.style.setProperty("--fill", `${fill}%`);
  }
  const wallet = window.PokerProgression.create(read('nocturne.progress.v3',{}), value => save('nocturne.progress.v3',value));
  const uniqueId=()=>crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  let gameId = uniqueId(), lastReward = null, topupBusy = false;
  let pendingTopup = read('nocturne.pendingTopup.v3',{});
  function paintProgress() {
    const w=wallet.inspect();
    document.body.dataset.cardSkin=w.skin;
    $('wallet-coins').textContent=fmt(w.coins);
    $('wallet-level').textContent='Nivel '+w.level;
    $('wallet-reserve').textContent=fmt(w.reserve);
    $('lobby-progress').innerHTML='<div><span class="eyebrow">TU PRÓXIMO PASO</span><h3>Nivel '+w.level+'</h3><p>'+fmt(w.xp-w.levelStart)+' / '+fmt(w.levelNext-w.levelStart)+' XP</p></div><progress aria-label="Progreso de nivel" value="'+(w.xp-w.levelStart)+'" max="'+(w.levelNext-w.levelStart)+'"></progress><button class="text-button" id="open-progress">Ver objetivos ↗</button>';
    $('open-progress').addEventListener('click',()=>openPanel('progress'));
    if(activePanel==='shop'||activePanel==='progress')$('panel-content').innerHTML=panelMarkup(activePanel);
  }
  function celebrate(reward) {
    lastReward=reward;
    $('reward-celebration').innerHTML='<span class="reward-orbit">✦</span><div><strong>+'+reward.coins+' monedas · +'+reward.xp+' XP</strong><small>'+(reward.unlocks.join(' · ')||'Una mano más en tu historia.')+'</small></div>';
    $('reward-celebration').hidden=false;
    clearTimeout(celebrate.timer);celebrate.timer=setTimeout(()=>$('reward-celebration').hidden=true,4800);
    sound('reward'); paintProgress();
  }
  function syncTopup(state) {
    if(pendingTopup.code!==state.code||!pendingTopup.receipt)return;
    const confirmed=state.topupReceipts?.find(r=>r.receipt===pendingTopup.receipt);
    if(!confirmed)return;
    try {wallet.consume(confirmed.amount,confirmed.receipt);pendingTopup={};save('nocturne.pendingTopup.v3',pendingTopup);paintProgress();toast('Recarga confirmada: +'+fmt(confirmed.amount)+' fichas.');}catch(error){toast(error.message);}
  }
  async function applyReserve(amount) {
    if(topupBusy||wallet.inspect().reserve<amount)return;
    if(networkMode) {
      if(!networkAvailable||networkPending||(engine&&engine.phase!=='complete')) {toast('Recarga al terminar la mano.');return;}
      topupBusy=true;
      const receipt=pendingTopup.receipt||uniqueId();
      const code=networkEpoch?.split('.')[0]||document.getElementById('room-code').textContent;
      pendingTopup={code,receipt,amount};save('nocturne.pendingTopup.v3',pendingTopup);
      try {const state=await window.PokerRoom.topup(amount,receipt);if(state)syncTopup(state);}
      finally {topupBusy=false;paintProgress();}
    } else {
      if(!engine||engine.phase!=='complete'){toast('Tu reserva se añade al empezar una nueva partida individual.');return;}
      wallet.consume(amount);const p=engine.players[0];p.stack+=amount;p.eliminated=false;
      engine.log('rebuy',0,amount,'Recarga de '+amount+' fichas');render();paintProgress();sound('chip');toast('+'+fmt(amount)+' fichas en tu stack.');
    }
  }
  function recordResult() {
    if (!engine.result || recordedHand === engine.handNumber) return;
    if (networkMode) {
      const key = `nocturne.room.result.${networkEpoch}.${engine.handNumber}`;
      try { if (sessionStorage.getItem(key)) { recordedHand = engine.handNumber; return; } sessionStorage.setItem(key, "1"); } catch {}
    }
    recordedHand = engine.handNumber;
    stats.handsPlayed++;
    lastReward=null;
    const won = engine.result.pots.some((p) => p.winners.includes(0));
    const wonChips = engine.result.awards[0] - engine.result.refunds[0];
    if (won) {
      stats.handsWon++;
      stats.chipsWon += wonChips;
      stats.biggestPot = Math.max(stats.biggestPot, wonChips);
    }
    const survivors = engine.players.filter((p) => p.stack > 0);
    if (
      !outcomeRecorded &&
      (survivors.length === 1 || engine.players[0].stack === 0)
    ) {
      outcomeRecorded = true;
      if (survivors.length === 1 && survivors[0].id === 0) stats.gamesWon++;
    }
    save("nocturne.stats.v1", stats);
    const own=engine.players[0];
    const reward=wallet.reward({id:(networkMode?'friends:'+networkEpoch:gameId)+':'+engine.handNumber,won,
      showdown:engine.result.showdown&&!own.folded,finished:survivors.length===1||own.stack===0,
      champion:survivors.length===1&&survivors[0].id===0,eligible:own.cards.length>0});
    if(reward)celebrate(reward);
    else sound(won ? "win" : "card");
  }
  function renderResult() {
    $('result-reward').textContent=lastReward?'+'+lastReward.coins+' monedas · +'+lastReward.xp+' XP'+(lastReward.leveled?' · Nivel '+lastReward.level:''):'';
    const r = engine.result,
      winners = [...new Set(r.pots.flatMap((p) => p.winners))],
      won = winners.includes(0);
    const survivors = engine.players.filter((p) => p.stack > 0),
      gameOver = survivors.length === 1 || engine.players[0].stack === 0;
    $("result-eyebrow").textContent = gameOver
      ? "FIN DE LA PARTIDA"
      : r.showdown
        ? "SHOWDOWN"
        : "TODOS LOS RIVALES SE RETIRARON";
    if (survivors.length === 1 && survivors[0].id === 0)
      $("result-title").textContent = "La mesa es tuya.";
    else if (engine.players[0].stack === 0)
      $("result-title").textContent = "Hasta la próxima mano.";
    else
      $("result-title").textContent = won
        ? `Te llevas ${fmt(r.awards[0] - r.refunds[0])} fichas.`
        : winners.length === 1
          ? `${engine.players[winners[0]].name} se lleva el bote.`
          : "El bote encuentra varios dueños.";
    const hand = winners.length === 1 ? r.hands[winners[0]]?.name : "";
    $("result-description").textContent = gameOver
      ? engine.players[0].stack > 0
        ? "Ganaste la partida. Has reunido las 6.000 fichas de la mesa."
        : "Te has quedado sin fichas virtuales. Una mesa nueva te espera."
      : r.showdown
        ? `${hand ? `${hand}. ` : ""}Las mejores cinco cartas deciden. ${winners.length > 1 ? "Consulta el reparto de cada bote." : ""}`
        : "La mano termina sin revelar las cartas privadas rivales.";
    $("pot-breakdown").innerHTML = r.pots
      .map(
        (p, i) =>
          `<div>${i ? `Secundario ${i}` : "Principal"} · <b>${fmt(p.amount)}</b> → ${p.winners.map((id) => escapeHtml(engine.players[id].name)).join(" + ")}${p.winners.length > 1 ? " (repartido)" : ""}</div>`,
      )
      .join("");
    $("next-hand-button").innerHTML =
      `${gameOver ? "NUEVA PARTIDA" : "SIGUIENTE MANO"} <svg><use href="#i-arrow"/></svg>`;
    if (networkMode) {
      const ended = survivors.length === 1;
      $("next-hand-button").textContent = window.PokerRoom.isHost() ? (ended ? "Volver a la sala" : "Siguiente mano") : "Esperando al organizador";
      $("next-hand-button").disabled = !window.PokerRoom.isHost() || !networkAvailable || networkPending;
      if (engine.players[0].stack === 0 && !ended) $("result-description").textContent = "Puedes seguir viendo la partida hasta que termine.";
      else if (ended) $("result-description").textContent = `${survivors[0].name} ha reunido las ${fmt(survivors[0].stack)} fichas de la mesa.`;
    } else $("next-hand-button").disabled = false;
  }
  function progress() {
    if (networkMode) return;
    if (!engine || paused || lobbyVisible || dealing || $("panel-dialog").open)
      return;
    if (engine.phase === "complete") {
      recordResult();
      render();
      return;
    }
    const fast = settings.speed === "fast";
    if (engine.phase === "transition") {
      schedule(
        () => {
          engine.advanceStreet();
          sound("card");
          render();
          progress();
        },
        fast ? 360 : 1150,
      );
    } else if (engine.phase === "betting" && engine.actor !== 0) {
      const actor = engine.actor;
      schedule(
        () => {
          // Probability work starts after the thinking animation is visible.
          const decision = AI.chooseAction(
            engine.observation(actor),
            settings.difficulty,
          );
          const event = engine.act(actor, decision.type, decision.total);
          flyChips(actor, event.amount, event.type === "allin");
          render();
          progress();
        },
        fast ? 250 + Math.random() * 200 : 1000 + Math.random() * 1050,
      );
    }
  }
  function beginHand() {
    cancelScheduled();
    paused = false;
    dealing = true;
    engine.startHand();
    $("board").innerHTML = "";
    document.querySelectorAll(".hole-cards").forEach((c) => {
      c.innerHTML = "";
    });
    displayedPot = 0;
    render({ deal: true });
    sound("card");
    schedule(
      () => {
        dealing = false;
        render();
        progress();
      },
      settings.reducedMotion ? 180 : settings.speed === "fast" ? 900 : 1450,
    );
  }
  function newGame() {
    if (networkMode) { toast("Sal de la sala para empezar una partida individual."); return; }
    cancelScheduled();
    const extra=Math.min(2000,Math.floor(wallet.inspect().reserve/500)*500);
    if(extra)wallet.consume(extra);
    engine = new Engine({stacks:[1000+extra,1000,1000,1000,1000,1000]});
    gameId=uniqueId();lastReward=null;paintProgress();
    recordedHand = 0;
    outcomeRecorded = false;
    stats.gamesPlayed++;
    save("nocturne.stats.v1", stats);
    lobbyVisible = false;
    $("lobby").hidden = true;
    $("game").hidden = false;
    $("play-button").querySelector("span").textContent = "CONTINUAR";
    createSeats();
    window.scrollTo({ top: 0 });
    beginHand();
  }
  function showLobby() {
    if (networkMode) { openPanel("settings"); return; }
    cancelScheduled();
    paused = true;
    lobbyVisible = true;
    $("lobby").hidden = false;
    $("game").hidden = true;
    if (dealing) dealing = false;
    $("play-button").querySelector("span").textContent = engine
      ? "CONTINUAR"
      : "JUGAR AHORA";
    window.scrollTo({ top: 0 });
  }
  function resumeGame() {
    if (!engine) {
      newGame();
      return;
    }
    lobbyVisible = false;
    paused = false;
    $("lobby").hidden = true;
    $("game").hidden = false;
    render();
    progress();
    window.scrollTo({ top: 0 });
  }
  function setPaused(value) {
    if (networkMode) return;
    paused = value;
    cancelScheduled();
    if (paused && dealing) dealing = false;
    render();
    if (!paused) progress();
  }
  function panelMarkup(name) {
    const w=wallet.inspect();
    if(name==='shop') {
      const canApply=(!networkMode&&engine?.phase==='complete')||(networkMode&&(!engine||engine.phase==='complete'));
      return '<span class="eyebrow">TU COLECCIÓN. TU MESA.</span><h2>Un poco más tuyo.</h2><p class="panel-intro">Gana monedas jugando. Elige lo que quieres, con precios claros.</p><div class="shop-wallet"><div><span>Monedas</span><strong>'+fmt(w.coins)+'</strong></div><div><span>Fichas en reserva</span><strong>'+fmt(w.reserve)+'</strong></div></div><h3>Fichas para volver a la mesa</h3><div class="shop-grid">'+window.PokerProgression.catalog.filter(i=>i.type==='chips').map(i=>'<article class="shop-item"><span class="shop-token">'+i.icon+'</span><strong>'+fmt(i.amount)+' fichas</strong><p>'+i.description+'</p><button class="button" data-buy="'+i.id+'" '+(w.coins<i.cost?'disabled':'')+'>Comprar · '+i.cost+' monedas</button></article>').join('')+'</div><div class="reserve-actions">'+[500,1000,2000].map(n=>'<button class="button outline-button" data-apply-chips="'+n+'" '+(!canApply||w.reserve<n||topupBusy?'disabled':'')+'>Añadir '+fmt(n)+' a la mesa</button>').join('')+'</div><p class="panel-footnote">Máximo 2.000 por pausa en salas. Sólo antes de empezar o entre manos. En modo individual, hasta 2.000 de tu reserva se añaden al iniciar una partida nueva.</p><h3>Elige tu dorso</h3><div class="shop-grid skin-grid">'+[{id:'classic',name:'Azul original',cost:0,type:'skin'},...window.PokerProgression.catalog.filter(i=>i.type==='skin')].map(i=>'<article class="shop-item"><span class="skin-sample skin-'+i.id+'">N</span><strong>'+i.name+'</strong><button class="button '+(w.skin===i.id?'outline-button':'')+'" '+(w.owned.includes(i.id)?'data-equip="'+i.id+'"':'data-buy="'+i.id+'"')+' '+(!w.owned.includes(i.id)&&w.coins<i.cost?'disabled':'')+'>'+(w.skin===i.id?'En uso':w.owned.includes(i.id)?'Usar diseño':i.cost+' monedas')+'</button></article>').join('')+'</div><p class="panel-footnote">Monedas, reserva y colección guardadas en este navegador. Sin dinero real ni valor de canje. Borrar los datos del navegador borra este progreso.</p>';
    }
    if(name==='progress') return '<span class="eyebrow">PASO A PASO</span><h2>Tu historia sigue.</h2><div class="level-card"><span>Nivel '+w.level+'</span><strong>'+fmt(w.xp)+' XP</strong><progress aria-label="Experiencia" value="'+(w.xp-w.levelStart)+'" max="'+(w.levelNext-w.levelStart)+'"></progress><p>'+fmt(w.levelNext-w.xp)+' XP para el siguiente nivel · Premio: 25 monedas</p></div><div class="mission-list">'+window.PokerProgression.missions.map(m=>'<article class="mission '+(w.claimed.includes(m.id)?'mission-complete':'')+'"><div><strong>'+m.title+'</strong><p>'+m.description+'</p><progress aria-label="'+m.title+'" value="'+Math.min(w[m.metric],m.target)+'" max="'+m.target+'"></progress></div><span>'+(w.claimed.includes(m.id)?'✓ Cobrado':Math.min(w[m.metric],m.target)+'/'+m.target+' · +'+m.coins+' monedas')+'</span></article>').join('')+'</div><p class="panel-footnote">Una mano: +6 monedas y +20 XP. Ganarla: +14 monedas y +20 XP extra. Showdown sin retirarte: +4 monedas. Torneo terminado: +20 monedas, o +100 si eres campeón. Primera victoria: +25 monedas. Los objetivos se cobran automáticamente y no caducan.</p><button class="button" id="progress-to-shop">Explorar la tienda</button>';

    if (name === "difficulty")
      return `<span class="eyebrow">ELIGE TU DESAFÍO</span><h2>La misma mesa. Otro nivel.</h2><p class="panel-intro">Los cinco rivales conservan su personalidad. Tú eliges cuánto tendrán en cuenta las probabilidades.</p><div class="difficulty-options">${[
        [
          "easy",
          "♧",
          "Fácil",
          "Más errores, decisiones menos precisas y una mesa para aprender.",
        ],
        [
          "normal",
          "♢",
          "Normal",
          "Probabilidades, faroles y decisiones razonables.",
        ],
        [
          "hard",
          "♠",
          "Difícil",
          "Más simulaciones, posición y presión de las apuestas anteriores.",
        ],
      ]
        .map(
          ([key, symbol, label, copy]) =>
            `<button class="difficulty-option${settings.difficulty === key ? " selected" : ""}" data-difficulty="${key}" aria-pressed="${settings.difficulty === key}"><span class="difficulty-symbol">${symbol}</span><span><strong>${label}</strong><small>${copy}</small></span><i class="selection-dot"></i></button>`,
        )
        .join(
          "",
        )}</div><p class="panel-footnote">El cambio se aplica a las siguientes decisiones de los rivales. Las cartas de los demás permanecen ocultas para cada bot.</p>`;
    if (name === "settings")
      return `<span class="eyebrow">A TU RITMO</span><h2>Haz tuya la mesa.</h2><p class="panel-intro">Los ajustes se guardan en este navegador.</p><label class="setting-row"><span><strong>Sonidos de la mesa</strong><small>Cartas, fichas y un pequeño guiño al ganar.</small></span><input class="toggle" type="checkbox" data-setting="sound" ${settings.sound ? "checked" : ""} aria-label="Sonidos de la mesa"></label><div class="sound-test-row"><button class="button outline-button" id="test-sound">Probar sonido</button><small id="sound-status" role="status">Toca para escuchar la melodía.</small></div><label class="setting-row"><span><strong>Reducir movimiento</strong><small>Transiciones discretas y sin desplazamientos.</small></span><input class="toggle" type="checkbox" data-setting="reducedMotion" ${settings.reducedMotion ? "checked" : ""} aria-label="Reducir movimiento"></label><label class="setting-row"><span><strong>Ritmo de la partida</strong><small>Tiempo de pensamiento y cambio de rondas.</small></span><select data-setting="speed" aria-label="Ritmo de la partida"><option value="natural" ${settings.speed === "natural" ? "selected" : ""}>Natural</option><option value="fast" ${settings.speed === "fast" ? "selected" : ""}>Ágil</option></select></label><button class="button new-game-button" id="settings-new-game">EMPEZAR UNA NUEVA PARTIDA</button><p class="panel-footnote">La nueva partida reinicia la mesa a 1.000 fichas por jugador. Conserva tus estadísticas. No se guarda una mano interrumpida al cerrar o recargar.</p>`;
    if (name === "stats") {
      const values = [
        ["PARTIDAS JUGADAS", fmt(stats.gamesPlayed)],
        ["PARTIDAS GANADAS", fmt(stats.gamesWon)],
        ["MANOS JUGADAS", fmt(stats.handsPlayed)],
        ["MANOS GANADAS", fmt(stats.handsWon)],
        [
          "VICTORIAS DE PARTIDA",
          `${stats.gamesPlayed ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0}%`,
        ],
        [
          "VICTORIAS DE MANO",
          `${stats.handsPlayed ? Math.round((stats.handsWon / stats.handsPlayed) * 100) : 0}%`,
        ],
        ["MAYOR BOTE COBRADO", fmt(stats.biggestPot)],
        ["FICHAS GANADAS ACUMULADAS", fmt(stats.chipsWon)],
      ];
      return `<span class="eyebrow">TU HISTORIA EN LA MESA</span><h2>Cada mano deja huella.</h2><p class="panel-intro">Resultados guardados localmente. Las manos empatadas que cobran cuentan como manos ganadas.</p><div class="stats-grid">${values.map(([label, value]) => `<div class="stat-cell"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div><p class="panel-footnote">Las partidas jugadas cuentan desde que te sientas. Una victoria de partida exige ser el último jugador con fichas. Las fichas acumuladas son botes cobrados, incluidas aportaciones propias y sin devoluciones.</p>`;
    }
    return `<span class="eyebrow">TEXAS HOLD'EM · NO LIMIT</span><h2>Dos cartas. Muchas posibilidades.</h2><p class="panel-intro">Forma la mejor mano de cinco cartas usando cualquiera de tus dos cartas privadas y las cinco comunitarias.</p><ol class="rules-flow"><li><strong>Ciegas 10 / 20.</strong> Cada asiento empieza con 1.000 fichas. El botón D avanza tras cada mano.</li><li><strong>Preflop → flop → turn → river.</strong> Dos cartas privadas, tres comunitarias y otras dos de una en una. Hay apuestas en cada etapa.</li><li><strong>Fold, check, call, raise o all-in.</strong> Pasa si nadie te exige fichas. Iguala o retírate frente a una apuesta. «Subir a» indica el total que aportarás en esa ronda.</li><li><strong>Showdown.</strong> Gana la mejor combinación; si todos menos uno se retiran, la mano termina antes.</li></ol><h3 class="eyebrow">DE MAYOR A MENOR</h3><ol class="rankings">${["Escalera real", "Escalera de color", "Póker", "Full house", "Color", "Escalera", "Trío", "Doble pareja", "Pareja", "Carta alta"].map((x) => `<li>${x}</li>`).join("")}</ol><div class="rule-box">La subida mínima iguala el tamaño de la última subida completa. Un all-in corto no reabre la apuesta para quien ya actuó, salvo incrementos acumulados suficientes. Cada bote secundario sólo lo pueden ganar quienes lo cubren. Los empates se dividen y la ficha impar va al primer ganador a la izquierda del botón. El as puede ser alto o bajo en A-2-3-4-5. En heads-up, el botón pone la ciega pequeña y juega primero preflop.<br><br>Referencias: <a href="https://www.pokerstars.com/help/articles/poker-rules-master/215788/" target="_blank" rel="noopener">reglas de Hold'em</a> · <a href="https://www.pokerstarslive.net/poker/cashgamerules/" target="_blank" rel="noopener">reparto de botes</a>.</div><p class="panel-footnote">Todas las fichas son virtuales. No hay depósitos, retiradas ni conversión a dinero.</p>`;
  }
  function openPanel(name) {
    activePanel = name;
    resumeAfterPanel = !networkMode && !!engine && !paused && !lobbyVisible;
    if (resumeAfterPanel) {
      paused = true;
      cancelScheduled();
      if (dealing) dealing = false;
    }
    $("panel-content").innerHTML = panelMarkup(name);
    if (networkMode && name === 'settings') {
      $("settings-new-game").hidden = true;
      const rows = $("panel-content").querySelectorAll('.setting-row');
      rows[2]?.setAttribute('hidden','');
      const footnote=$("panel-content").querySelector('.panel-footnote');
      if(footnote) footnote.textContent='Las salas siguen activas mientras ves los ajustes. Tu asiento se recupera al recargar. Cada turno dura 30 segundos.';
    }
    $("panel-dialog").showModal();
    if (engine) render();
  }
  function closePanel() {
    $("panel-dialog").close();
    activePanel = null;
    if (resumeAfterPanel) {
      paused = false;
      render();
      progress();
    } else if (engine) render();
    resumeAfterPanel = false;
  }
  $("play-button").addEventListener("click", () => {
    sound("click");
    resumeGame();
  });
  $("lobby-button").addEventListener("click", showLobby);
  $("brand-home").addEventListener("click", (event) => {
    event.preventDefault();
    showLobby();
  });
  $("pause-button").addEventListener("click", () => setPaused(!paused));
  $("resume-button").addEventListener("click", () => setPaused(false));
  $("close-panel").addEventListener("click", closePanel);
  $("panel-dialog").addEventListener("cancel", (event) => {
    event.preventDefault();
    closePanel();
  });
  document
    .querySelectorAll("[data-panel]")
    .forEach((button) =>
      button.addEventListener("click", () => openPanel(button.dataset.panel)),
    );
  document.querySelectorAll(".sound-button").forEach((button) =>
    button.addEventListener("click", () => {
      settings.sound = !settings.sound;
      applySettings();
      sound("click");
    }),
  );
  $('shop-button').addEventListener('click',()=>openPanel('shop'));
  $('quick-sound').addEventListener('click',async()=>{settings.sound=true;applySettings();unlockSound();const ok=await sound('win');toast(ok?'Sonido activo.':'Toca de nuevo para activar el sonido.');});
  $("panel-content").addEventListener("click", async (event) => {
    const buy=event.target.closest('[data-buy]'),equip=event.target.closest('[data-equip]'),topup=event.target.closest('[data-apply-chips]');
    try {
      if(buy){const item=wallet.buy(buy.dataset.buy);paintProgress();sound('reward');toast(item.type==='chips'?'+'+fmt(item.amount)+' fichas en tu reserva.':'Diseño desbloqueado: '+item.name);}
      if(equip){wallet.equip(equip.dataset.equip);paintProgress();sound('click');}
      if(topup)await applyReserve(Number(topup.dataset.applyChips));
    }catch(error){toast(error.message);}
    if(event.target.closest('#progress-to-shop')){$('panel-content').innerHTML=panelMarkup('shop');activePanel='shop';}
    if(event.target.closest('#test-sound')) {
      settings.sound=true;applySettings();unlockSound();
      const ok=await sound('win');const status=$('sound-status');if(status)status.textContent=ok?'Sonido activo. Si no lo oyes, revisa el volumen del dispositivo.':'El audio está bloqueado. Toca de nuevo para activarlo.';
      const toggle=$('panel-content').querySelector('[data-setting="sound"]');if(toggle)toggle.checked=true;
    }
    const difficulty = event.target.closest("[data-difficulty]");
    if (difficulty) {
      settings.difficulty = difficulty.dataset.difficulty;
      applySettings();
      $("panel-content").innerHTML = panelMarkup("difficulty");
      toast(`Dificultad ${DIFFICULTIES[settings.difficulty]}`);
    }
    if (event.target.closest("#settings-new-game")) {
      resumeAfterPanel = false;
      closePanel();
      newGame();
    }
  });
  $("panel-content").addEventListener("change", (event) => {
    const key = event.target.dataset.setting;
    if (!key) return;
    settings[key] =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    applySettings();
    sound("click");
  });
  $("raise-slider").addEventListener("input", updateRaise);
  document.querySelectorAll("[data-size]").forEach((button) =>
    button.addEventListener("click", () => {
      const l = engine.legalActions(0),
        sizes = {
          min: l.minTotal,
          half: engine.currentBet + Math.round((engine.pot + l.toCall) / 2),
          pot: engine.currentBet + engine.pot + l.toCall,
          double: engine.currentBet * 2 || 40,
        };
      $("raise-slider").value = Math.max(
        l.minTotal,
        Math.min(l.maxTotal, sizes[button.dataset.size]),
      );
      updateRaise();
      sound("click");
    }),
  );
  document.querySelectorAll("[data-action]").forEach((button) =>
    button.addEventListener("click", () => {
      if (button.disabled || dealing || paused || !engine || engine.actor !== 0)
        return;
      if (networkMode) { window.PokerRoom.action(button.dataset.action, Number($("raise-slider").value)); return; }
      try {
        cancelScheduled();
        const event = engine.act(
          0,
          button.dataset.action,
          Number($("raise-slider").value),
        );
        flyChips(0, event.amount, event.type === "allin");
        if (!event.amount) sound("click");
        render();
        progress();
      } catch (error) {
        toast(error.message);
        render();
        progress();
      }
    }),
  );
  $("next-hand-button").addEventListener("click", () => {
    if (networkMode) {
      if (engine.players.filter(p => p.stack > 0).length === 1) window.PokerRoom.reset(); else window.PokerRoom.next();
      return;
    }
    if (engine.phase !== "complete") return;
    if (
      engine.players[0].stack === 0 ||
      engine.players.filter((p) => p.stack > 0).length === 1
    )
      newGame();
    else beginHand();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && engine && !paused && !lobbyVisible) setPaused(true);
  });
  window.addEventListener("poker-room-error", event => toast(event.detail));
  window.addEventListener("poker-room-state", event => {
    const { state, online, busy } = event.detail;
    cancelScheduled(); paused = false; dealing = false;
    networkAvailable = online; networkPending = busy;
    if (!state) {
      if (networkMode) { engine = null; networkMode = false; networkEpoch = null; networkVersion = null; $("game").hidden = true; showLobby(); }
      return;
    }
    networkMode = true; syncTopup(state); lobbyVisible = false; $("lobby").hidden = true;
    if (!state.game) { engine = null; $("game").hidden = true; paintProgress(); return; }
    const epoch = `${state.code}.${state.epoch}`;
    if (engine && networkEpoch === epoch && networkVersion === state.version) {
      renderControls();
      if (engine.phase === 'complete') renderResult();
      return;
    }
    networkVersion = state.version;
    const first = networkEpoch !== epoch || !engine;
    const oldHand = engine?.handNumber;
    const oldStreet = engine?.street;
    const oldActor = engine?.actor;
    const oldSeq = engine?.history.at(-1)?.seq || 0;
    engine = { ...state.game,
      get live() { return this.players.filter(p => !p.folded && !p.eliminated); },
      legalActions() { return this.legal; },
      observation() { return { players: this.players.map(({ cards, ...p }) => p) }; }
    };
    if (first) {
      networkEpoch = epoch; recordedHand = 0; outcomeRecorded = false; createSeats();
      const key = `nocturne.room.played.${epoch}`;
      try { if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, "1"); stats.gamesPlayed++; save("nocturne.stats.v1",stats); } } catch {}
    }
    if (oldHand !== engine.handNumber) {
      $("board").replaceChildren(); document.querySelectorAll(".hole-cards").forEach(c => c.replaceChildren());
    }
    const eventAction = engine.history.at(-1);
    if(first||oldHand!==engine.handNumber||oldStreet!==engine.street)sound('card');
    else if(oldActor!==engine.actor&&engine.actor===0)sound('click');
    if(eventAction?.seq>oldSeq&&['check','fold'].includes(eventAction.type))sound('click');
    $("game").hidden = false;
    render({ deal: first || oldHand !== engine.handNumber });
    if (eventAction?.seq > oldSeq && eventAction.id !== null && eventAction.amount > 0) flyChips(eventAction.id, eventAction.amount, eventAction.type === "allin");
    if (engine.phase === "complete") recordResult();
    paintProgress();
  });
  // Read-only diagnostics for reproducible browser QA. No privileged cards are
  // exposed during a hand and no API can bypass the actual action buttons.
  window.Nocturne = Object.freeze({
    inspect: () =>
      engine
        ? {
            phase: engine.phase,
            actor: engine.actor,
            street: engine.street,
            handNumber: engine.handNumber,
            paused,
            dealing,
            pot: engine.pot,
            board: engine.board.map((c) => ({ ...c })),
            players: engine.observation(0).players,
            legal: engine.legalActions(0),
            result: engine.result
              ? JSON.parse(JSON.stringify(engine.result))
              : null,
          }
        : null,
    statistics: () => ({ ...stats }),
    settings: () => ({ ...settings }),
    audio: () => window.PokerSound.inspect(),
    wallet: () => wallet.inspect(),
  });
  applySettings();
  paintProgress();
})();
