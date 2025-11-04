// Temperature conversion logic
(function(){
  const form = document.getElementById('conv-form');
  const input = document.getElementById('temp-input');
  const fromUnit = document.getElementById('from-unit');
  const toUnit = document.getElementById('to-unit');
  const message = document.getElementById('message');
  const result = document.getElementById('result');
  const swapBtn = document.getElementById('swap-btn');
  const clearBtn = document.getElementById('clear-btn');
  const range = document.getElementById('temp-range');
  const liveToggle = document.getElementById('live-toggle');
  const resultValue = document.getElementById('result-value');
  const resultUnit = document.getElementById('result-unit');
  const resultNote = document.getElementById('result-note');
  const thermFill = document.querySelector('.therm-fill');

  function toCelsius(value, unit){
    switch(unit){
      case 'C': return value;
      case 'F': return (value - 32) * 5/9;
      case 'K': return value - 273.15;
    }
  }

  function fromCelsius(celsius, unit){
    switch(unit){
      case 'C': return celsius;
      case 'F': return (celsius * 9/5) + 32;
      case 'K': return celsius + 273.15;
    }
  }

  function formatNumber(n){
    // Show integer if whole number else 2 decimal places
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
  }

  // animate numeric value using requestAnimationFrame
  function animateNumber(from, to, duration = 700){
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t<.5 ? 2*t*t : -1 + (4 - 2*t)*t; // simple ease
      const value = from + (to - from) * eased;
      resultValue.textContent = Number.isInteger(to) && t===1 ? formatNumber(Math.round(value)) : formatNumber(value);
      if(t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setThermVisual(celsius){
    // map celsius -30..50 to 0..100%
    const min = -30, max = 50;
    const pct = Math.max(0, Math.min(1, (celsius - min) / (max - min)));
    thermFill.style.height = `${Math.round(pct * 100)}%`;
    // color shift from blue to red
    const cold = {r:0,g:160,b:255};
    const hot = {r:255,g:69,b:0};
    const r = Math.round(cold.r + (hot.r - cold.r) * pct);
    const g = Math.round(cold.g + (hot.g - cold.g) * pct);
    const b = Math.round(cold.b + (hot.b - cold.b) * pct);
    thermFill.style.background = `linear-gradient(180deg,rgb(${r},${g},${b}), rgba(${r},${g},${b},0.85))`;
  }

  function showError(msg){
    message.textContent = msg;
    result.textContent = '';
  }

  function clearError(){ message.textContent = ''; }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    clearError();

    // run the conversion and animate the display
    const raw = input.value.trim();
    if(raw === ''){ showError('Please enter a temperature value.'); input.focus(); return; }

    const value = Number(raw);
    if(Number.isNaN(value)){
      showError('Invalid number. Please enter a numeric value.'); input.focus(); return;
    }

    const from = fromUnit.value;
    const to = toUnit.value;
    if(from === to){
      animateNumber(Number(resultValue.textContent) || 0, value);
      resultUnit.textContent = unitLabel(to);
      resultNote.textContent = `No conversion needed (${unitLabel(from)})`;
      setThermVisual(toCelsius(value, from));
      return;
    }

    const celsius = toCelsius(value, from);
    const converted = fromCelsius(celsius, to);
    animateNumber(Number(resultValue.textContent) || 0, converted);
    resultUnit.textContent = unitLabel(to);
    resultNote.textContent = `Converted from ${formatNumber(value)} ${unitLabel(from)}`;
    setThermVisual(celsius);
    // persist last
    try{ localStorage.setItem('temp_last', JSON.stringify({value,from,to,live:!!liveToggle.checked})); }catch(e){}
  });

  swapBtn.addEventListener('click', function(){
    const a = fromUnit.value;
    const b = toUnit.value;
    fromUnit.value = b;
    toUnit.value = a;
    // swap input/result text if present
    if(result.textContent){
      // no complex parsing; clear result after swap to avoid confusion
      result.textContent = '';
    }
    // update slider ranges to match new unit
    adjustRangeForUnit(fromUnit.value);
  });

  clearBtn.addEventListener('click', function(){
    input.value = '';
    result.textContent = '';
    clearError();
    input.focus();
  });

  // live conversion and slider syncing
  input.addEventListener('input', function(){
    range.value = input.value || 0;
    if(liveToggle.checked) form.requestSubmit();
  });
  range.addEventListener('input', function(){
    input.value = range.value;
    if(liveToggle.checked) form.requestSubmit();
  });
  fromUnit.addEventListener('change', function(){ adjustRangeForUnit(fromUnit.value); if(liveToggle.checked) form.requestSubmit(); });
  toUnit.addEventListener('change', function(){ if(liveToggle.checked) form.requestSubmit(); });

  function adjustRangeForUnit(unit){
    // sensible slider ranges per unit
    if(unit === 'C'){ range.min = -50; range.max = 80; }
    if(unit === 'F'){ range.min = -58; range.max = 176; }
    if(unit === 'K'){ range.min = 0; range.max = 353; }
    // clamp current value
    if(Number(range.value) < Number(range.min)) range.value = range.min;
    if(Number(range.value) > Number(range.max)) range.value = range.max;
    // reflect to input
    input.value = range.value;
  }

  // restore last state
  try{
    const last = JSON.parse(localStorage.getItem('temp_last') || 'null');
    if(last){
      input.value = last.value;
      fromUnit.value = last.from;
      toUnit.value = last.to;
      liveToggle.checked = !!last.live;
      adjustRangeForUnit(fromUnit.value);
      range.value = input.value;
    } else {
      adjustRangeForUnit(fromUnit.value);
    }
  }catch(e){ adjustRangeForUnit(fromUnit.value); }

  function unitLabel(u){
    switch(u){
      case 'C': return '°C';
      case 'F': return '°F';
      case 'K': return 'K';
    }
  }
})();