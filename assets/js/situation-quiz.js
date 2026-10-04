(function(){
  'use strict';
  var EN_VALUE = {
    'снизить вес': 'lose weight',
    'набрать мышцы': 'gain muscle',
    'вернуть режим': 'restore routine',
    'наладить питание': 'fix nutrition',
    'собрать дисциплину': 'build discipline',
    'понять формат': 'understand the right format',
    'вес стоит': 'weight is stuck',
    'срывы': 'breakdowns',
    'мало энергии': 'low energy',
    'нет плана': 'no plan',
    'есть ограничения': 'limitations/injuries',
    'нехватка времени': 'lack of time'
  };
  function isEnglish(){
    return document.documentElement.lang === 'en' || window.mmSafeStorage.get('markovmade_lang', 'ru') === 'en';
  }
  function formatValue(raw){
    return isEnglish() ? (EN_VALUE[raw] || raw) : raw;
  }
  function initV13Quiz(){
    var root=document.getElementById('request-quiz');
    if(!root || root.__v13Ready) return;
    root.__v13Ready=true;
    var summary=document.getElementById('quiz-summary');
    var tg=document.getElementById('quiz-telegram-link');
    function collect(group){
      return Array.prototype.slice.call(root.querySelectorAll('[data-quiz-group="'+group+'"] .mm-editorial-option.active')).map(function(btn){
        var raw=(btn.getAttribute('data-value')||btn.textContent||'').trim();
        return formatValue(raw);
      });
    }
    function update(){
      var en=isEnglish();
      var goals=collect('goal');
      var blockers=collect('blocker');
      var emptyGoal=en?'choose a point':'выберите пункт';
      var emptyBlocker=en?'choose a point':'выберите пункт';
      var defaultGoal=en?'still choosing':'пока выбираю';
      var defaultBlocker=en?'to clarify during the audit':'нужно понять на разборе';
      var text=en
        ? 'Hello! I want a MARKOVMADE personal assessment. Goal: '+(goals.length?goals.join(', '):defaultGoal)+'. Main blocker: '+(blockers.length?blockers.join(', '):defaultBlocker)+'. I want to understand where to start and which work format fits me.'
        : 'Здравствуйте! Хочу персональный разбор MARKOVMADE. Цель: '+(goals.length?goals.join(', '):defaultGoal)+'. Главный стопор: '+(blockers.length?blockers.join(', '):defaultBlocker)+'. Хочу понять, с чего начать и какой формат работы мне подходит.';
      if(summary) {
        var ready = goals.length || blockers.length;
        var line = en
          ? 'Request context: goal — '+(goals.length?goals.join(', '):emptyGoal)+'; main blocker — '+(blockers.length?blockers.join(', '):emptyBlocker)+'.'
          : 'Контекст заявки: цель — '+(goals.length?goals.join(', '):emptyGoal)+'; главный стопор — '+(blockers.length?blockers.join(', '):emptyBlocker)+'.';
        summary.classList.toggle('mm-editorial-detail-quiz-ready', !!ready);
        summary.innerHTML = ready
          ? (en ? '<b>Your details are ready.</b><span class="mm-editorial-detail-thank-note">Now send them in Telegram — so I can reply based on your actual situation, not with generic advice.</span><span class="mm-editorial-detail-thank-note">'+line+'</span>' : '<b>Вводные собраны.</b><span class="mm-editorial-detail-thank-note">Теперь отправьте их в Telegram — так я отвечу не общими словами, а по вашей ситуации.</span><span class="mm-editorial-detail-thank-note">'+line+'</span>')
          : line;
      }
      if(tg) { tg.href='https://t.me/markovmade?text='+encodeURIComponent(text); tg.textContent = en ? 'Send to Pavel' : 'Отправить Павлу'; }
    }
    window.mmV13QuizUpdate = update;
    root.querySelectorAll('.mm-editorial-option').forEach(function(btn){
      btn.addEventListener('click',function(){
        btn.classList.toggle('active');
        update();
        if(window.mmTrack) window.mmTrack('v13_quiz_select',{value:btn.getAttribute('data-value')});
      });
    });
    document.querySelectorAll('[data-lang-toggle]').forEach(function(btn){
      btn.addEventListener('click',function(){ setTimeout(update, 90); });
    });
    update();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initV13Quiz,{once:true}); else initV13Quiz();
})();
