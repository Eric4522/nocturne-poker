(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokerSound = api.create({ AudioContext: root.AudioContext || root.webkitAudioContext });
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const tones = {
    card:[[0,420,.05],[.035,270,.05]], chip:[[0,1150,.045],[.06,760,.045],[.12,1350,.045]],
    click:[[0,550,.07]], win:[[0,440,.18],[.15,554,.18],[.3,659,.3]],
    allin:[[0,165,.16],[.12,220,.18],[.28,330,.2]], reward:[[0,659,.14],[.12,880,.14],[.25,1047,.3]]
  };
  function create({ AudioContext } = {}) {
    let context = null, enabled = true, played = 0, lastError = null;
    function unlock() {
      if (!enabled || !AudioContext) return Promise.resolve(false);
      try {
        if (!context || context.state === 'closed') context = new AudioContext();
        // Called synchronously by a user gesture, before any asynchronous work.
        const resumed = context.state === 'running' ? Promise.resolve() : context.resume();
        const source = context.createBufferSource();
        source.buffer = context.createBuffer(1, 1, context.sampleRate);
        source.connect(context.destination); source.start(0);
        source.onended = () => source.disconnect();
        return Promise.resolve(resumed).then(() => { lastError = null; return context.state === 'running'; })
          .catch(error => { lastError = error.message; return false; });
      } catch(error) { lastError = error.message; return Promise.resolve(false); }
    }
    async function play(type) {
      if (!enabled || !(await unlock()) || !enabled) return false;
      try {
        for (const [offset,frequency,duration] of tones[type] || tones.click) {
          const oscillator = context.createOscillator(), gain = context.createGain(), start = context.currentTime + offset;
          oscillator.type = type === 'chip' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(.0001,start);
          gain.gain.exponentialRampToValueAtTime(.12,start+.012);
          gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
          oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start+duration+.03);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        }
        played++; return true;
      } catch(error) { lastError = error.message; return false; }
    }
    return Object.freeze({unlock,play,setEnabled(value){enabled=!!value;},inspect:()=>({enabled,state:context?.state||'locked',played,lastError})});
  }
  return {create};
});
