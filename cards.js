(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PokerCards = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const SUITS = ["s", "h", "d", "c"];
  const SYMBOLS = { s: "♠", h: "♥", d: "♦", c: "♣" };
  const NAMES = [
    "Carta alta",
    "Pareja",
    "Doble pareja",
    "Trío",
    "Escalera",
    "Color",
    "Full house",
    "Póker",
    "Escalera de color",
  ];
  const rankLabel = (rank) =>
    ({ 14: "A", 13: "K", 12: "Q", 11: "J", 10: "10" })[rank] || String(rank);
  function makeCard(rank, suit) {
    return { rank, suit, id: `${rank}${suit}` };
  }
  function parse(code) {
    const suit = code.slice(-1),
      label = code.slice(0, -1).toUpperCase();
    const rank = { A: 14, K: 13, Q: 12, J: 11, T: 10 }[label] || Number(label);
    if (
      !SUITS.includes(suit) ||
      !Number.isInteger(rank) ||
      rank < 2 ||
      rank > 14
    )
      throw new Error("Carta inválida");
    return makeCard(rank, suit);
  }
  function deck() {
    return SUITS.flatMap((s) =>
      Array.from({ length: 13 }, (_, i) => makeCard(i + 2, s)),
    );
  }
  function random() {
    if (globalThis.crypto?.getRandomValues)
      return (
        globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296
      );
    return Math.random();
  }
  function shuffle(input, rng = random) {
    const out = input.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function value(category, kickers, cards) {
    let score = category;
    for (let i = 0; i < 5; i++) score = score * 15 + (kickers[i] || 0);
    return {
      category,
      kickers,
      score,
      cards: cards.slice(),
      name:
        category === 8 && kickers[0] === 14 ? "Escalera real" : NAMES[category],
    };
  }
  // Unchecked hot path: callers validate once, outside the 21 combinations.
  function five(cards) {
    const sorted = cards.map((c) => c.rank).sort((a, b) => b - a);
    const counts = new Map();
    sorted.forEach((r) => counts.set(r, (counts.get(r) || 0) + 1));
    const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const flush = cards.every((c) => c.suit === cards[0].suit);
    let straight = 0;
    if (counts.size === 5) {
      if (sorted[0] - sorted[4] === 4) straight = sorted[0];
      else if (sorted.join(",") === "14,5,4,3,2") straight = 5;
    }
    if (flush && straight) return value(8, [straight], cards);
    if (groups[0][1] === 4)
      return value(
        7,
        groups.map((g) => g[0]),
        cards,
      );
    if (groups[0][1] === 3 && groups[1][1] === 2)
      return value(
        6,
        groups.map((g) => g[0]),
        cards,
      );
    if (flush) return value(5, sorted, cards);
    if (straight) return value(4, [straight], cards);
    if (groups[0][1] === 3)
      return value(
        3,
        groups.map((g) => g[0]),
        cards,
      );
    if (groups[0][1] === 2 && groups[1][1] === 2)
      return value(
        2,
        groups.map((g) => g[0]),
        cards,
      );
    if (groups[0][1] === 2)
      return value(
        1,
        groups.map((g) => g[0]),
        cards,
      );
    return value(0, sorted, cards);
  }
  function evaluate(cards) {
    if (!Array.isArray(cards) || cards.length < 5 || cards.length > 7)
      throw new Error("Se requieren entre 5 y 7 cartas");
    const ids = cards.map((c) => {
      if (
        !SUITS.includes(c.suit) ||
        !Number.isInteger(c.rank) ||
        c.rank < 2 ||
        c.rank > 14
      )
        throw new Error("Carta inválida");
      return `${c.rank}${c.suit}`;
    });
    if (new Set(ids).size !== ids.length) throw new Error("Cartas duplicadas");
    let best = null;
    for (let a = 0; a < cards.length - 4; a++)
      for (let b = a + 1; b < cards.length - 3; b++)
        for (let c = b + 1; c < cards.length - 2; c++)
          for (let d = c + 1; d < cards.length - 1; d++)
            for (let e = d + 1; e < cards.length; e++) {
              const hand = five([
                cards[a],
                cards[b],
                cards[c],
                cards[d],
                cards[e],
              ]);
              if (!best || hand.score > best.score) best = hand;
            }
    return best;
  }
  const compare = (a, b) => Math.sign(a.score - b.score);
  return {
    SUITS,
    SYMBOLS,
    NAMES,
    rankLabel,
    makeCard,
    parse,
    deck,
    shuffle,
    random,
    evaluate,
    five,
    compare,
  };
});
