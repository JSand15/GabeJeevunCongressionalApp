
(() => {
  "use strict";
  const STORAGE_KEY = "skillspring-little-explorers-v1";
  const TOTAL_ROUNDS = 4;
  const worldInfo = {
    letters: { title:"Letter Lagoon", emoji:"🦜", stickers:["🦜","🌺","🛶"], names:["Parrot Pal","Lagoon Flower","Little Canoe"] },
    numbers: { title:"Counting Garden", emoji:"🍎", stickers:["🍎","🐝","🌻"], names:["Apple Buddy","Busy Bee","Golden Sunflower"] },
    shapes: { title:"Shape Safari", emoji:"🧩", stickers:["🦋","⭐","🪁"], names:["Butterfly Buddy","Shining Star","Colorful Kite"] },
    feelings:{ title:"Feelings Forest", emoji:"🦊", stickers:["🦊","💗","🌈"], names:["Fox Friend","Kind Heart","Rainbow Smile"] }
  };
  const levelNames = ["Little Seed","Growing Sprout","Super Sprout"];
  const LETTERS = [
    {letter:"A", lower:"a", picture:"🍎", word:"apple", sound:"a"},
    {letter:"B", lower:"b", picture:"🐻", word:"bear", sound:"b"},
    {letter:"C", lower:"c", picture:"🐱", word:"cat", sound:"k"},
    {letter:"D", lower:"d", picture:"🐶", word:"dog", sound:"d"},
    {letter:"F", lower:"f", picture:"🐟", word:"fish", sound:"f"},
    {letter:"M", lower:"m", picture:"🌙", word:"moon", sound:"m"},
    {letter:"S", lower:"s", picture:"☀️", word:"sun", sound:"s"}
  ];
  const SHAPES = ["circle","triangle","square","star","rectangle","heart"];
  const FACES = [
    { id:"happy", emoji:"😊", label:"happy" },
    { id:"sad", emoji:"😢", label:"sad" },
    { id:"surprised", emoji:"😮", label:"surprised" },
    { id:"angry", emoji:"😠", label:"angry" },
    { id:"sleepy", emoji:"😴", label:"sleepy" },
    { id:"silly", emoji:"😜", label:"silly" }
  ];
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const rand = (n) => Math.floor(Math.random() * n);
  const sample = (items) => items[rand(items.length)];
  const shuffle = (items) => {
    const result = [...items];
    for(let i=result.length-1;i>0;i--){
      const j=rand(i+1);
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  };
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g,(char)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
  function defaultProgress(){
    return {
      stars:0, sound:true, stickers:[],
      worlds:Object.fromEntries(Object.keys(worldInfo).map(w=>[w,{level:1,history:[],completed:0}]))
    };
  }
  function loadProgress(){
    const empty=defaultProgress();
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if(!raw || typeof raw!=="object") return empty;
      empty.stars=Number.isFinite(raw.stars)?Math.max(0,Math.min(99999,Math.floor(raw.stars))):0;
      empty.sound=typeof raw.sound==="boolean"?raw.sound:true;
      empty.stickers=Array.isArray(raw.stickers)?raw.stickers.filter(v=>typeof v==="string" && /^[a-z]+-[123]$/.test(v)): [];
      for(const name of Object.keys(worldInfo)){
        const saved=raw.worlds?.[name];
        if(!saved) continue;
        empty.worlds[name].level=[1,2,3].includes(saved.level)?saved.level:1;
        empty.worlds[name].history=Array.isArray(saved.history)?saved.history.slice(-6).filter(v=>typeof v==="boolean"):[];
        empty.worlds[name].completed=Number.isInteger(saved.completed)?Math.max(0,Math.min(9999,saved.completed)):0;
      }
    }catch(_error){ /* private browsing and blocked storage are supported */ }
    return empty;
  }
  let progress=loadProgress();
  let currentPage="home";
  let currentWorld=null;
  let round=0;
  let question=null;
  let mistakes=0;
  let resolved=false;
  let usedQuestions=new Set();

  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch(_error){}
  }
  function say(text){
    if(!progress.sound || !("speechSynthesis" in window)) return;
    try{
      speechSynthesis.cancel();
      const utterance=new SpeechSynthesisUtterance(text);
      utterance.lang="en-US";
      utterance.rate=.84;
      utterance.pitch=1.12;
      utterance.volume=1;
      speechSynthesis.speak(utterance);
    }catch(_error){ /* speech is optional */ }
  }
  function stopSpeech(){
    if("speechSynthesis" in window){try{speechSynthesis.cancel();}catch(_error){}}
  }
  function updateChrome(){
    $("#headerStars").textContent=progress.stars.toLocaleString();
    $("#soundBtn").textContent=progress.sound?"🔊":"🔇";
    $("#soundBtn").setAttribute("aria-label",progress.sound?"Turn spoken instructions off":"Turn spoken instructions on");
    $("#soundBtn").setAttribute("aria-pressed",String(progress.sound));
    for(const [name,state] of Object.entries(progress.worlds)){
      const target=document.querySelector(`[data-level="${name}"]`);
      if(target) target.textContent=levelNames[state.level-1];
    }
  }
  function showPage(name){
    if(!["home","map","stickers","game","finish"].includes(name)) return;
    if(name!=="game") stopSpeech();
    currentPage=name;
    $$(".page").forEach(page=>{page.hidden=page.id!==(name+"Page");});
    $$(".nav-tab").forEach(btn=>{
      const selected=btn.dataset.page===name;
      btn.classList.toggle("current",selected);
      if(selected) btn.setAttribute("aria-current","page");
      else btn.removeAttribute("aria-current");
    });
    if(name==="stickers") drawStickers();
    updateChrome();
    window.scrollTo({top:0,behavior:"instant"});
  }
  function choicesAround(correct, pool, count=3){
    return shuffle([correct,...shuffle(pool.filter(v=>v!==correct)).slice(0,count-1)]);
  }
  function avoidRepeat(candidates, key){
    const fresh=candidates.filter(item=>!usedQuestions.has(key(item)));
    const selection=sample(fresh.length?fresh:candidates);
    usedQuestions.add(key(selection));
    return selection;
  }
  function letterQuestion(level){
    const item=avoidRepeat(LETTERS,v=>v.letter);
    const remaining=LETTERS.map(i=>i.letter);
    if(level===1){
      return {
        title:"Find my letter!",
        prompt:`Tap the letter ${item.letter}`,
        spoken:`Can you find the letter ${item.letter}? Tap it!`,
        visual:{kind:"letter",value:item.letter},
        options:choicesAround(item.letter,remaining).map(v=>({id:v,symbol:v,text:""})),
        correct:item.letter,
        hint:`Look for ${item.letter}.`
      };
    }
    if(level===2){
      const distractors=shuffle(LETTERS.filter(i=>i!==item)).slice(0,2);
      return {
        title:"Which picture begins with…?",
        prompt:`The ${item.letter} sound`,
        spoken:`Which picture begins with the ${item.letter} sound? Look at the pictures and pick one.`,
        visual:{kind:"letter",value:item.letter},
        options:shuffle([item,...distractors]).map(v=>({id:v.letter,symbol:v.picture,text:v.word})),
        correct:item.letter,
        hint:`Listen for ${item.word}.`
      };
    }
    return {
      title:"Find the little letter!",
      prompt:`Match ${item.letter} to its little letter`,
      spoken:`Find the lowercase letter that matches uppercase ${item.letter}.`,
      visual:{kind:"letter",value:item.letter},
      options:choicesAround(item.letter,remaining).map(v=>({id:v,symbol:LETTERS.find(l=>l.letter===v).lower,text:""})),
      correct:item.letter,
      hint:`Look for the little ${item.lower}.`
    };
  }
  function numbersQuestion(level){
    const range=level===1?[1,2,3]:level===2?[2,3,4,5]:[4,5,6,7];
    const number=avoidRepeat(range,v=>String(v));
    const emoji=sample(["🍎","🐞","🐥","⭐","🍓","🌼"]);
    const pool=[1,2,3,4,5,6,7,8];
    // Prefer nearby distractors: answers are never duplicated.
    const nearby=pool.filter(n=>n!==number).sort((a,b)=>Math.abs(a-number)-Math.abs(b-number));
    const possibilities=shuffle(nearby.slice(0,Math.min(4,nearby.length))).slice(0,2);
    return {
      title:"Let's count together!",
      prompt:"How many do you see?",
      spoken:`Tap each ${emoji==="🍎"?"apple":emoji==="🐞"?"ladybug":emoji==="🐥"?"chick":emoji==="⭐"?"star":emoji==="🍓"?"strawberry":"flower"} to count. How many are there?`,
      visual:{kind:"count",value:number,emoji},
      options:shuffle([number,...possibilities]).map(v=>({id:String(v),symbol:String(v),text:""})),
      correct:String(number),
      hint:`Point to each one as you count. ${number} in all!`
    };
  }
  function shapeSVG(name,dim=90){
    const shapes={
      circle:'<circle cx="50" cy="50" r="35" fill="#70D5CB"/>',
      triangle:'<path d="M50 10 L92 85 L8 85 Z" fill="#FFB264"/>',
      square:'<rect x="17" y="17" width="66" height="66" rx="7" fill="#9484E7"/>',
      star:'<path d="M50 7 L62 36 L93 39 L69 59 L77 90 L50 73 L23 90 L31 59 L7 39 L38 36 Z" fill="#F6CD5D"/>',
      rectangle:'<rect x="7" y="26" width="86" height="49" rx="7" fill="#FF9AB6"/>',
      heart:'<path d="M50 88 C22 67 7 51 9 31 C11 10 39 5 50 27 C65 2 91 14 91 36 C91 56 70 75 50 88Z" fill="#EF82B0"/>'
    };
    return `<svg viewBox="0 0 100 100" width="${dim}" height="${dim}" role="img" aria-label="${name}">${shapes[name] || shapes.circle}</svg>`;
  }
  function shapesQuestion(level){
    if(level===3){
      const base=avoidRepeat(SHAPES,v=>v);
      const other=sample(SHAPES.filter(s=>s!==base));
      const pool=choicesAround(base,SHAPES);
      return {
        title:"What comes next?",
        prompt:"Finish the pattern!",
        spoken:"Look at the pattern. What shape comes next?",
        visual:{kind:"pattern",value:[base,other,base,other]},
        options:pool.map(v=>({id:v,symbol:v,text:v,shape:true})),
        correct:base,
        hint:`The shapes take turns. Look for the ${base}.`
      };
    }
    const items=level===1?SHAPES.slice(0,3):SHAPES;
    const selected=avoidRepeat(items,v=>v);
    return {
      title:level===1?"Find my shape!":"Shape detective!",
      prompt:level===1?`Tap the ${selected}`:({triangle:"Which shape has 3 sides?",square:"Which shape has 4 equal sides?",rectangle:"Which shape has 2 long sides?",circle:"Which shape is round?",star:"Which shape has pointy tips?",heart:"Which shape looks like a heart?"})[selected],
      spoken:level===1?`Can you find the ${selected}?`:({triangle:"Find the shape with three sides.",square:"Find the shape with four equal sides.",rectangle:"Find the long rectangle.",circle:"Find the round circle.",star:"Find the star with pointy tips.",heart:"Find the heart shape."})[selected],
      visual:{kind:"shape",value:selected},
      options:choicesAround(selected,items).map(v=>({id:v,symbol:v,text:v,shape:true})),
      correct:selected,
      hint:`Look carefully for the ${selected}.`
    };
  }
  function feelingsQuestion(level){
    const options=level===1?FACES.slice(0,3):level===2?FACES.slice(0,4):FACES;
    const face=avoidRepeat(options,v=>v.id);
    const stories={
      happy:"Pip's friend has a big smile. Which face matches?",
      sad:"A fox looks sad and has tears. Which face matches?",
      surprised:"A bunny opens their mouth wide in surprise. Which face matches?",
      angry:"A bear is frowning because something went wrong. Which face matches?",
      sleepy:"A kitten yawns and wants to rest. Which face matches?",
      silly:"Pip makes a silly face with his tongue out. Which face matches?"
    };
    return {
      title:level<3?"Find the feeling!":"Read the face!",
      prompt:level<3?`Which face looks ${face.label}?`:stories[face.id],
      spoken:level<3?`Can you find the ${face.label} face?`:stories[face.id],
      visual:{kind:"feeling",value:level===1?"💗":level===2?"🌈":"🦊"},
      options:shuffle([face,...shuffle(options.filter(f=>f.id!==face.id)).slice(0,2)]).map(v=>({id:v.id,symbol:v.emoji,text:v.label})),
      correct:face.id,
      hint:`Look for the ${face.label} face.`
    };
  }
  function makeQuestion(){
    const level=progress.worlds[currentWorld].level;
    return ({
      letters:letterQuestion,
      numbers:numbersQuestion,
      shapes:shapesQuestion,
      feelings:feelingsQuestion
    })[currentWorld](level);
  }
  function renderVisual(visual){
    const target=$("#questionVisual");
    target.innerHTML="";
    target.setAttribute("aria-hidden",visual.kind==="count"?"false":"true");
    if(visual.kind==="letter"){
      const span=document.createElement("span");
      span.className="visual-letter";span.textContent=visual.value;target.appendChild(span);
    }else if(visual.kind==="count"){
      const playArea=document.createElement("div");
      playArea.className="count-play-area";
      const hint=document.createElement("div");
      hint.className="count-hint";hint.textContent="👆 Tap each one to count!";
      playArea.appendChild(hint);
      const items=document.createElement("div");
      items.className="count-items";
      let tapped=0;
      for(let n=0;n<visual.value;n++){
        const object=document.createElement("button");
        object.type="button";object.className="visual-count";
        object.textContent=visual.emoji;object.setAttribute("aria-label",`Count item ${n+1}`);
        object.addEventListener("click",()=>{
          if(object.classList.contains("tapped") || resolved)return;
          object.classList.add("tapped");object.disabled=true;tapped++;
          counter.textContent=tapped===visual.value?`✨ ${tapped}! All counted!`:`⭐ ${tapped} counted`;
          if(tapped===visual.value) say(`Great counting! You counted ${tapped}. Now find the number.`);
        });
        items.appendChild(object);
      }
      playArea.appendChild(items);
      const counter=document.createElement("div");
      counter.className="count-counter";counter.setAttribute("aria-live","polite");counter.textContent="🌟 0 counted";
      playArea.appendChild(counter);target.appendChild(playArea);
    }else if(visual.kind==="shape"){
      target.innerHTML=shapeSVG(visual.value,112);
    }else if(visual.kind==="pattern"){
      target.innerHTML=visual.value.map(value=>shapeSVG(value,76)).join("")+'<span class="visual-letter" style="font-size:78px;color:#E6A87B">?</span>';
    }else if(visual.kind==="feeling"){
      const span=document.createElement("span");
      span.className="visual-feeling";span.textContent=visual.value;target.appendChild(span);
    }
  }
  function renderQuestion(){
    mistakes=0;resolved=false;
    question=makeQuestion();
    $("#gameTitle").textContent=question.title;
    $("#gamePrompt").textContent=question.prompt;
    $("#roundLabel").textContent=`${round+1} of ${TOTAL_ROUNDS}`;
    $("#gameWorldLabel").textContent=worldInfo[currentWorld].title;
    $("#feedback").textContent="Pick the answer you like best!";
    $("#nextBtn").hidden=true;
    $("#progressDots").innerHTML=Array.from({length:TOTAL_ROUNDS},(_,i)=>`<span class="progress-dot ${i<round?"done":i===round?"current":""}"></span>`).join("");
    renderVisual(question.visual);
    const choices=$("#answerGrid");choices.replaceChildren();
    for(const option of question.options){
      const button=document.createElement("button");
      button.type="button";button.className="answer-choice";
      button.dataset.answer=option.id;
      button.setAttribute("aria-label",option.text?`${option.text}`:`${option.id}`);
      if(option.shape) button.innerHTML=shapeSVG(option.symbol,80);
      else {
        const span=document.createElement("span");
        span.className="choice-symbol";span.textContent=option.symbol;
        button.appendChild(span);
      }
      if(option.text){
        const text=document.createElement("span");text.className="choice-text";text.textContent=option.text;
        button.appendChild(text);
      }
      button.addEventListener("click",()=>chooseAnswer(button,option.id));
      choices.appendChild(button);
    }
    say(question.spoken);
  }
  function updateDifficulty(wasFirstTry){
    const state=progress.worlds[currentWorld];
    state.history.push(Boolean(wasFirstTry));state.history=state.history.slice(-6);
    const lastThree=state.history.slice(-3);
    const lastTwo=state.history.slice(-2);
    if(lastThree.length===3 && lastThree.every(Boolean) && state.level<3){
      state.level++;state.history=[];return;
    }
    if(lastTwo.length===2 && lastTwo.every(v=>!v) && state.level>1){
      state.level--;state.history=[];return;
    }
  }
  function chooseAnswer(button,answer){
    if(resolved) return;
    if(answer!==question.correct){
      mistakes++;
      button.classList.add("try-again");
      const message=mistakes>=2?`${question.hint} 🌱`:"Good try! Let's look again. 💛";
      $("#feedback").textContent=message;
      if(mistakes>=2){
        $$(".answer-choice").forEach(btn=>btn.classList.toggle("hint",btn.dataset.answer===question.correct));
      }
      say(mistakes>=2?question.hint:"Good try. Have another look!");
      return;
    }
    resolved=true;
    button.classList.add("correct");
    $$(".answer-choice").forEach(btn=>{btn.disabled=true;});
    $("#feedback").textContent=sample([
      "Hooray! You did it! 🌟","Amazing exploring! 🌈","Pip says: ribbit, hooray! 🐸","You kept trying! ⭐"
    ]);
    $("#nextBtn").hidden=false;
    $("#nextBtn").textContent=round===TOTAL_ROUNDS-1?"🌟 Collect my sticker!":"Next little step ➜";
    progress.stars=Math.min(99999,progress.stars+1);
    updateDifficulty(mistakes===0);
    updateChrome();save();
    say("Hooray! Great job!");
  }
  function beginWorld(name){
    if(!(name in worldInfo))return;
    currentWorld=name;round=0;usedQuestions=new Set();
    showPage("game");renderQuestion();
  }
  function finishWorld(){
    const state=progress.worlds[currentWorld];
    state.completed++;
    const stickerTier=Math.min(state.completed,3);
    const stickerKey=`${currentWorld}-${stickerTier}`;
    if(!progress.stickers.includes(stickerKey)) progress.stickers.push(stickerKey);
    save();
    const info=worldInfo[currentWorld];
    $("#earnedSticker").textContent=info.stickers[stickerTier-1];
    $("#earnedSticker").setAttribute("aria-label",`${info.names[stickerTier-1]} sticker`);
    $("#stickerLabel").textContent=`${info.names[stickerTier-1]} sticker`;
    $("#finishMessage").textContent=`You explored ${info.title} and tried four fun things!`;
    showPage("finish");
    say("Hip hip hooray! You did it! Time to stretch and take a little break!");
  }
  function drawStickers(){
    const grid=$("#stickerGrid");grid.replaceChildren();
    let unlocked=0;
    for(const [world,info] of Object.entries(worldInfo)){
      for(let tier=1;tier<=3;tier++){
        const earned=progress.stickers.includes(`${world}-${tier}`);if(earned)unlocked++;
        const tile=document.createElement("div");
        tile.className=`sticker-tile${earned?"":" locked"}`;
        const icon=document.createElement("span");icon.className="sticker-art";icon.textContent=earned?info.stickers[tier-1]:"❔";
        const title=document.createElement("strong");title.textContent=earned?info.names[tier-1]:"Mystery sticker";
        const desc=document.createElement("small");desc.textContent=earned?info.title:"Keep exploring to discover";
        tile.append(icon,title,desc);grid.appendChild(tile);
      }
    }
    $("#stickerSummary").textContent=unlocked?`${unlocked} of 12 happy stickers collected!`: "No stickers yet — your first adventure awaits!";
  }
  // Navigation uses event delegation to support both desktop and iPad touch.
  document.addEventListener("click",(event)=>{
    const pageButton=event.target.closest("[data-page]");
    if(pageButton){showPage(pageButton.dataset.page);return;}
    const worldButton=event.target.closest("[data-world]");
    if(worldButton){beginWorld(worldButton.dataset.world);}
  });
  $("#surpriseBtn").addEventListener("click",()=>beginWorld(sample(Object.keys(worldInfo))));
  $("#hearAgain").addEventListener("click",()=>{if(question) say(question.spoken)});
  $("#soundBtn").addEventListener("click",()=>{
    progress.sound=!progress.sound;save();updateChrome();
    if(progress.sound) say("Hello, explorer! Sound is on.");
    else stopSpeech();
  });
  $("#nextBtn").addEventListener("click",()=>{
    if(!resolved)return;
    if(round>=TOTAL_ROUNDS-1)finishWorld();
    else{round++;renderQuestion();}
  });
  const guide=$("#grownupsDialog");
  $("#grownupsBtn").addEventListener("click",()=>guide.showModal());
  $("#closeGrownups").addEventListener("click",()=>guide.close());
  $("#resetProgress").addEventListener("click",()=>{
    if(window.confirm("Clear this device's SkillSpring stars, stickers, and learning progress?")){
      progress=defaultProgress();save();guide.close();updateChrome();showPage("home");
    }
  });
  updateChrome();
  drawStickers();
  if("serviceWorker" in navigator && location.protocol.startsWith("http")){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
})();
