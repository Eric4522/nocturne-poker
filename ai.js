(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./cards.js"));
  else root.PokerAI = factory(root.PokerCards);
})(typeof globalThis !== "undefined" ? globalThis : this, function (C) {
  "use strict";
  const PROFILES = {
    conservative: { caution: 0.09, aggression: 0.18, bluff: 0.015, size: 0.5 },
    aggressive: { caution: -0.025, aggression: 0.68, bluff: 0.13, size: 0.9 },
    unpredictable: {
      caution: -0.015,
      aggression: 0.43,
      bluff: 0.22,
      size: 0.75,
    },
    strategic: { caution: 0.025, aggression: 0.4, bluff: 0.055, size: 0.65 },
    balanced: { caution: 0.01, aggression: 0.33, bluff: 0.045, size: 0.6 },
    human: { caution: 0.01, aggression: 0.4, bluff: 0.035, size: 0.65 },
  };
  // Only receives a sanitized observation. Unknown cards include opponents' actual
  // cards: sampling must never remove those cards using privileged engine state.
  function equity(observation, samples = 90, rng = C.random) {
    const known = new Set(
      [...observation.cards, ...observation.board].map((c) => c.id),
    );
    const unknown = C.deck().filter((c) => !known.has(c.id));
    const opponents = observation.players.filter(
      (p) => p.id !== observation.id && !p.folded && !p.eliminated,
    ).length;
    if (!opponents) return 1;
    let shares = 0;
    for (let run = 0; run < samples; run++) {
      const pool = unknown.slice();
      function draw() {
        const i = Math.floor(rng() * pool.length),
          card = pool[i];
        pool[i] = pool[pool.length - 1];
        pool.pop();
        return card;
      }
      const board = observation.board.slice();
      while (board.length < 5) board.push(draw());
      const own = C.evaluate([...observation.cards, ...board]).score;
      let ties = 1,
        lost = false;
      for (let i = 0; i < opponents; i++) {
        const score = C.evaluate([draw(), draw(), ...board]).score;
        if (score > own) lost = true;
        else if (score === own) ties++;
      }
      if (!lost) shares += 1 / ties;
    }
    return shares / samples;
  }
  function chooseAction(
    o,
    difficulty = "normal",
    rng = C.random,
    sampleOverride,
  ) {
    const me = o.players.find((p) => p.id === o.id),
      l = o.legal;
    const p = PROFILES[me.profile] || PROFILES.balanced;
    const samples =
      sampleOverride ?? ({ easy: 28, normal: 90, hard: 200 }[difficulty] || 90);
    let eq = equity(o, samples, rng);
    if (difficulty === "easy")
      eq = Math.max(0, Math.min(1, eq + (rng() - 0.5) * 0.32));
    const price = l.callAmount / Math.max(1, o.pot + l.callAmount);
    const opponents =
      o.players.filter((x) => !x.folded && !x.eliminated).length - 1;
    const baseline = 1 / Math.max(2, opponents + 1);
    const position = (o.id - o.dealer + 6) % 6;
    const late = position === 0 || position >= 4;
    const raises = o.history.filter(
      (e) => e.type === "raise" || e.type === "allin",
    ).length;
    const pressure =
      difficulty === "hard" ? Math.min(0.075, raises * 0.016) : 0;
    const caution =
      p.caution + pressure - (difficulty === "hard" && late ? 0.02 : 0);
    // Balanced adapts to visible aggression; strategic uses price and position.
    const adaptation =
      me.profile === "balanced" ? Math.min(0.15, raises * 0.025) : 0;
    const bluff =
      rng() < p.bluff * (difficulty === "easy" ? 0.55 : 1) &&
      raises < 2 &&
      (late || me.profile === "unpredictable");
    const premium = eq > Math.max(0.64, baseline * 2.9);
    const strong = eq > Math.max(price + caution + 0.09, baseline * 1.35);
    if (
      l.allin &&
      premium &&
      (me.stack < o.pot * 1.6 || rng() < p.aggression * 0.15)
    )
      return { type: "allin" };
    if (l.raise && (strong || bluff) && rng() < p.aggression + adaptation) {
      const multiplier =
        me.profile === "unpredictable" ? 0.35 + rng() * 0.95 : p.size;
      const target = Math.min(
        l.maxTotal,
        Math.max(
          l.minTotal,
          o.currentBet +
            Math.round(Math.max(o.bigBlind * 2, o.pot * multiplier) / 10) * 10,
        ),
      );
      if (target === l.maxTotal && l.allin) return { type: "allin" };
      return { type: "raise", total: target };
    }
    if (l.check) return { type: "check" };
    const playable =
      eq >= price + caution ||
      (o.street === "preflop" &&
        l.toCall <= o.bigBlind &&
        eq > baseline * 0.85);
    if (l.call && (playable || (difficulty === "easy" && rng() < 0.14)))
      return { type: "call" };
    return { type: "fold" };
  }
  return { equity, chooseAction, PROFILES };
});
