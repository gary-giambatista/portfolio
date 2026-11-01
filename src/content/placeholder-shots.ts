/**
 * Drawn placeholder illustrations from the design prototype, used where screenshots were still to come.
 * Unused on the live site; kept for possible future use. Styles live in src/styles/placeholder-shots.css.
 */
export const shots = {
  phone: `<div class="phone"><div class="bar"></div><div class="prompt">to write · 書<br>stroke 4 of 10</div><div class="pad"><span>書</span></div><div class="btns"><i></i><i></i><i></i><i></i></div></div><div class="cap">Placeholder · app screenshot</div>`,
  youtube: `<div class="browser"><div class="chrome"><i></i><i></i><i></i></div><div class="body"><div class="yt"><div></div><div class="hide"></div><div></div><div class="hide"></div><div></div><div></div></div><div class="popup"><div>Hide negative <s></s></div><div>Hide Shorts <s></s></div><div>Mouseover peek <s class="off"></s></div></div></div></div><div class="cap">Placeholder · extension screenshot</div>`,
  cards: `<div class="stack"><div></div><div></div><div><span class="q">What does useEffect clean up?</span><span class="due"><span>Again</span><span>Next review: 4d</span></span></div></div><div class="cap">Placeholder · app screenshot</div>`,
  kana: `<div class="stack"><div></div><div></div><div><span class="kana">カ</span><span class="due"><span>ka?</span><span>12 / 46</span></span></div></div><div class="cap">Placeholder · app screenshot</div>`,
  gift: `<div class="widget"><div class="t">Choose your free gift</div><div class="row on"><i></i><span></span><b></b></div><div class="row"><i></i><span></span><b></b></div><div class="row"><i></i><span></span><b></b></div><div class="cta">Add to cart</div></div><div class="cap">Placeholder · widget screenshot</div>`,
  bundle: `<div class="widget"><div class="t">Build your bundle · save 15%</div><div class="row on"><i></i><span></span><b></b></div><div class="row on"><i></i><span></span><b></b></div><div class="row"><i></i><span></span><b></b></div><div class="cta">Add bundle · 2 of 3</div></div><div class="cap">Placeholder · widget screenshot</div>`,
} as const;
