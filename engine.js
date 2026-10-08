(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./cards.js"));
  else root.PokerEngine = factory(root.PokerCards);
})(typeof globalThis !== "undefined" ? globalThis : this, function (C) {
  "use strict";
  const PROFILES = [
    { name: "Tú", profile: "human", label: "Tu asiento", initials: "TÚ" },
    {
      name: "Elena",
      profile: "conservative",
      label: "Conservadora",
      initials: "EL",
    },
    { name: "Dante", profile: "aggressive", label: "Agresivo", initials: "DA" },
    {
      name: "Vera",
      profile: "unpredictable",
      label: "Impredecible",
      initials: "VE",
    },
    {
      name: "Atlas",
      profile: "strategic",
      label: "Estratégico",
      initials: "AT",
    },
    { name: "Nico", profile: "balanced", label: "Equilibrado", initials: "NI" },
  ];
  function clockwise(ids, button, length) {
    return ids
      .slice()
      .sort(
        (a, b) =>
          ((a - button - 1 + length) % length) -
          ((b - button - 1 + length) % length),
      );
  }
  function potLayers(players) {
    const levels = [
      ...new Set(players.map((p) => p.total).filter((n) => n > 0)),
    ].sort((a, b) => a - b);
    let previous = 0;
    const layers = levels.map((level) => {
      const contributors = players.filter((p) => p.total >= level);
      const pot = {
        amount: (level - previous) * contributors.length,
        eligible: contributors.filter((p) => !p.folded).map((p) => p.id),
      };
      previous = level;
      return pot;
    });
    // A folded contribution can end at a level without changing eligibility.
    // Such levels belong to the same pot, not artificial secondary pots.
    return layers.reduce((pots, layer) => {
      const last = pots[pots.length - 1];
      if (last && last.eligible.join(",") === layer.eligible.join(","))
        last.amount += layer.amount;
      else pots.push(layer);
      return pots;
    }, []);
  }
  function settlePots(players, board, button) {
    const n = players.length,
      awards = Array(n).fill(0),
      refunds = Array(n).fill(0);
    const copy = players.map((p) => ({ ...p }));
    const ordered = copy.slice().sort((a, b) => b.total - a.total);
    if (ordered.length > 1 && ordered[0].total > ordered[1].total) {
      const excess = ordered[0].total - ordered[1].total;
      refunds[ordered[0].id] = excess;
      awards[ordered[0].id] = excess;
      ordered[0].total -= excess;
    }
    const live = copy.filter((p) => !p.folded);
    const hands = {};
    if (live.length > 1)
      live.forEach((p) => {
        hands[p.id] = C.evaluate([...p.cards, ...board]);
      });
    const pots = potLayers(copy).map((pot) => {
      if (!pot.eligible.length) throw new Error("Bote sin jugador elegible");
      let winners = pot.eligible;
      if (winners.length > 1) {
        const best = Math.max(...winners.map((id) => hands[id].score));
        winners = winners.filter((id) => hands[id].score === best);
      }
      const share = Math.floor(pot.amount / winners.length);
      const oddOrder = clockwise(winners, button, n);
      winners.forEach((id) => {
        awards[id] += share;
      });
      for (let i = 0; i < pot.amount % winners.length; i++)
        awards[oddOrder[i]]++;
      return { ...pot, winners, share };
    });
    return {
      awards,
      refunds,
      pots,
      hands,
      showdown: live.length > 1,
      pot: copy.reduce((s, p) => s + p.total, 0),
    };
  }
  class Engine {
    constructor({ stacks = Array(6).fill(1000), rng = C.random } = {}) {
      if (
        stacks.length !== 6 ||
        stacks.some((x) => !Number.isInteger(x) || x < 0)
      )
        throw new Error("Seis stacks enteros no negativos");
      this.rng = rng;
      this.smallBlind = 10;
      this.bigBlind = 20;
      this.dealer = 3;
      this.players = PROFILES.map((p, id) => ({
        ...p,
        id,
        stack: stacks[id],
        bet: 0,
        total: 0,
        cards: [],
        folded: false,
        eliminated: stacks[id] === 0,
        lastAction: "",
        lastActedBet: null,
      }));
      this.phase = "idle";
      this.handNumber = 0;
      this.board = [];
      this.burned = [];
      this.deck = [];
      this.history = [];
      this.pending = new Set();
      this.actor = null;
      this.result = null;
    }
    get pot() {
      return this.players.reduce((sum, p) => sum + p.total, 0);
    }
    get live() {
      return this.players.filter((p) => !p.folded && !p.eliminated);
    }
    get able() {
      return this.live.filter((p) => p.stack > 0);
    }
    nextSeat(after, predicate) {
      for (let step = 1; step <= this.players.length; step++) {
        const id = (after + step) % this.players.length;
        if (predicate(this.players[id])) return id;
      }
      return null;
    }
    log(type, id = null, amount = 0, text = "") {
      const event = {
        seq: this.history.length,
        type,
        id,
        amount,
        text,
        street: this.street,
        hand: this.handNumber,
      };
      this.history.push(event);
      return event;
    }
    startHand() {
      if (!["idle", "complete"].includes(this.phase))
        throw new Error("La mano anterior no ha terminado");
      const active = this.players.filter((p) => p.stack > 0);
      if (active.length < 2) {
        this.phase = "finished";
        return false;
      }
      if (this.handNumber > 0 || this.players[this.dealer].stack === 0)
        this.dealer = this.nextSeat(this.dealer, (p) => p.stack > 0);
      if (active.length === 2 && this.previousPlayerCount > 2) {
        const proposedBB = this.nextSeat(this.dealer, (p) => p.stack > 0);
        if (proposedBB === this.lastBigBlind) this.dealer = proposedBB;
      }
      this.handNumber++;
      this.phase = "betting";
      this.street = "preflop";
      this.board = [];
      this.burned = [];
      this.deck = C.shuffle(C.deck(), this.rng);
      this.result = null;
      this.minRaise = this.bigBlind;
      this.currentBet = this.bigBlind;
      this.players.forEach((p) =>
        Object.assign(p, {
          bet: 0,
          total: 0,
          cards: [],
          folded: p.stack === 0,
          eliminated: p.stack === 0,
          lastAction: p.stack === 0 ? "Eliminado" : "",
          lastActedBet: null,
        }),
      );
      const sb =
        active.length === 2
          ? this.dealer
          : this.nextSeat(this.dealer, (p) => !p.eliminated);
      const bb = this.nextSeat(sb, (p) => !p.eliminated);
      this.lastBigBlind = bb;
      this.previousPlayerCount = active.length;
      const dealOrder = clockwise(
        active.map((p) => p.id),
        this.dealer,
        6,
      );
      for (let pass = 0; pass < 2; pass++)
        dealOrder.forEach((id) => this.players[id].cards.push(this.deck.pop()));
      this.log("hand", null, 0, `Mano ${this.handNumber}`);
      this.postBlind(sb, this.smallBlind, "Ciega pequeña");
      this.postBlind(bb, this.bigBlind, "Ciega grande");
      this.pending = new Set(this.able.map((p) => p.id));
      this.chooseNext(bb);
      return true;
    }
    pay(player, amount) {
      if (!Number.isInteger(amount) || amount < 0 || amount > player.stack)
        throw new Error("No tienes esas fichas");
      player.stack -= amount;
      player.bet += amount;
      player.total += amount;
    }
    postBlind(id, value, label) {
      const p = this.players[id],
        amount = Math.min(p.stack, value);
      this.pay(p, amount);
      p.lastAction = `${label} ${amount}${p.stack === 0 ? " · All-in" : ""}`;
      this.log("blind", id, amount, p.lastAction);
    }
    legalActions(id) {
      const p = this.players[id];
      const empty = {
        fold: false,
        check: false,
        call: false,
        raise: false,
        allin: false,
        toCall: 0,
        callAmount: 0,
        minTotal: 0,
        maxTotal: 0,
      };
      if (
        this.phase !== "betting" ||
        id !== this.actor ||
        !p ||
        p.folded ||
        p.stack === 0
      )
        return empty;
      const owed = Math.max(0, this.currentBet - p.bet),
        maxTotal = p.bet + p.stack;
      const reopened =
        p.lastActedBet === null ||
        this.currentBet - p.lastActedBet >= this.minRaise;
      const contest = this.able.some((other) => other.id !== id);
      const minTotal = this.currentBet + this.minRaise;
      return {
        fold: true,
        check: owed === 0,
        call: owed > 0,
        raise: contest && reopened && maxTotal >= minTotal,
        allin: maxTotal <= this.currentBet || (contest && reopened),
        toCall: owed,
        callAmount: Math.min(owed, p.stack),
        minTotal,
        maxTotal,
        reopened,
      };
    }
    act(id, action, total) {
      if (id !== this.actor || this.phase !== "betting")
        throw new Error("No es tu turno");
      const p = this.players[id],
        legal = this.legalActions(id);
      let amount = 0,
        target = p.bet;
      if (action === "fold") {
        if (!legal.fold) throw new Error("No puedes retirarte");
      } else if (action === "check") {
        if (!legal.check)
          throw new Error("No puedes pasar frente a una apuesta");
      } else if (action === "call") {
        if (!legal.call) throw new Error("No hay apuesta que igualar");
        target = p.bet + legal.callAmount;
      } else if (action === "raise") {
        if (!Number.isInteger(total) || total > legal.maxTotal)
          throw new Error("No tienes esas fichas");
        if (!legal.reopened) throw new Error("La apuesta no está reabierta");
        if (total < legal.minTotal)
          throw new Error(`Subida mínima: ${legal.minTotal}`);
        if (!legal.raise) throw new Error("No puedes subir");
        target = total;
      } else if (action === "allin") {
        if (!legal.allin)
          throw new Error(
            "All-in no permitido: apuesta no reabierta o sin rival",
          );
        target = legal.maxTotal;
      } else throw new Error("Acción desconocida");
      // All validation precedes mutation.
      if (action === "fold") p.folded = true;
      else {
        amount = target - p.bet;
        this.pay(p, amount);
      }
      if (target > this.currentBet) {
        const increment = target - this.currentBet;
        if (target >= legal.minTotal) this.minRaise = increment;
        this.currentBet = target;
        this.able.forEach((other) => {
          if (other.id !== id && other.bet < this.currentBet)
            this.pending.add(other.id);
        });
      }
      p.lastActedBet = this.currentBet;
      this.pending.delete(id);
      const labels = {
        fold: "Fold",
        check: "Check",
        call: `Call ${amount}`,
        raise: `Raise a ${target}`,
        allin: `All-in ${target}`,
      };
      p.lastAction =
        p.stack === 0 && action !== "fold"
          ? `All-in ${target}`
          : labels[action];
      const event = this.log(
        p.stack === 0 && action !== "fold" ? "allin" : action,
        id,
        amount,
        p.lastAction,
      );
      this.chooseNext(id);
      return event;
    }
    chooseNext(after) {
      if (this.live.length === 1) {
        this.finish();
        return;
      }
      for (const id of this.pending)
        if (this.players[id].folded || this.players[id].stack === 0)
          this.pending.delete(id);
      // A lone stack may call/fold an outstanding wager, but cannot bet into all-ins.
      if (this.able.length === 1) {
        // With no opponent stack left, the nominal big blind is no longer a
        // wagering floor. Only actual live all-in wagers can require a call.
        this.currentBet = Math.max(...this.live.map((p) => p.bet));
        if (this.able[0].bet >= this.currentBet) this.pending.clear();
      }
      if (!this.pending.size) {
        this.returnUncalled();
        this.actor = null;
        this.phase = "transition";
        return;
      }
      this.actor = this.nextSeat(after, (p) => this.pending.has(p.id));
      if (this.actor === null) throw new Error("Turno sin actor");
    }
    returnUncalled() {
      const ordered = this.players.slice().sort((a, b) => b.bet - a.bet);
      const excess = ordered[0].bet - ordered[1].bet;
      if (excess > 0) {
        const p = ordered[0];
        p.bet -= excess;
        p.total -= excess;
        p.stack += excess;
        this.log("refund", p.id, excess, `Devuelve ${excess} sin igualar`);
      }
    }
    advanceStreet() {
      if (this.phase !== "transition")
        throw new Error("Ronda de apuestas pendiente");
      if (this.street === "river") {
        this.finish();
        return;
      }
      this.burned.push(this.deck.pop());
      const next = { preflop: "flop", flop: "turn", turn: "river" }[
        this.street
      ];
      for (let i = 0; i < (next === "flop" ? 3 : 1); i++)
        this.board.push(this.deck.pop());
      this.street = next;
      this.currentBet = 0;
      this.minRaise = this.bigBlind;
      this.players.forEach((p) => {
        p.bet = 0;
        p.lastActedBet = null;
        if (!p.folded) p.lastAction = p.stack === 0 ? "All-in" : "";
      });
      this.log("board", null, 0, next.toUpperCase());
      this.phase = "betting";
      this.pending = new Set(this.able.map((p) => p.id));
      this.chooseNext(this.dealer);
    }
    finish() {
      this.returnUncalled();
      this.result = settlePots(this.players, this.board, this.dealer);
      this.result.hand = this.handNumber;
      this.players.forEach((p) => {
        p.stack += this.result.awards[p.id];
        p.bet = 0;
        p.total = 0;
        p.eliminated = p.stack === 0;
      });
      this.pending.clear();
      this.actor = null;
      this.phase = "complete";
      this.log("payout", null, this.result.pot, "Mano terminada");
    }
    observation(id) {
      const p = this.players[id];
      return {
        id,
        cards: p.cards.map((c) => ({ ...c })),
        board: this.board.map((c) => ({ ...c })),
        pot: this.pot,
        street: this.street,
        dealer: this.dealer,
        bigBlind: this.bigBlind,
        currentBet: this.currentBet,
        handNumber: this.handNumber,
        players: this.players.map(
          ({
            id,
            name,
            profile,
            stack,
            bet,
            total,
            folded,
            eliminated,
            lastAction,
          }) => ({
            id,
            name,
            profile,
            stack,
            bet,
            total,
            folded,
            eliminated,
            lastAction,
          }),
        ),
        legal: { ...this.legalActions(id) },
        history: this.history
          .filter((e) => e.hand === this.handNumber)
          .map((e) => ({ ...e })),
      };
    }
  }
  return { Engine, settlePots, potLayers, PROFILES };
});
