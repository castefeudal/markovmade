(function(){
  'use strict';
  var EN_VALUE = {
    'снизить вес': 'lose weight',
    'набрать мышцы': 'gain muscle',
    'вернуть режим': 'restore routine',
    'наладить питание': 'fix nutrition',
    'собрать дисциплину': 'build discipline',
    'понять формат': 'understand the right format',
    'вступить в сообщество': 'join the community',
    'вес стоит': 'weight is stuck',
    'срывы': 'hard to keep a routine',
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
    var wa=document.getElementById('quiz-whatsapp-link');
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
      var defaultGoal=en?'I would like to discuss my goal':'хочу обсудить свою задачу';
      var defaultBlocker=en?'I can explain more in chat':'расскажу подробнее в сообщении';
      var text=en
        ? 'Hello, Pavel. I would like to discuss working with MARKOVMADE. Goal: '+(goals.length?goals.join(', '):defaultGoal)+'. '+(blockers.length?'What is getting in the way: '+blockers.join(', ')+'. ':defaultBlocker+'. ')+'What would be a good place to start?'
        : 'Здравствуйте, Павел. Хочу обсудить работу с MARKOVMADE. Цель: '+(goals.length?goals.join(', '):defaultGoal)+'. '+(blockers.length?'Что мешает: '+blockers.join(', ')+'. ':defaultBlocker+'. ')+'Подскажите, с чего начать.';
      if(summary) {
        var ready = goals.length || blockers.length;
        var line = en
          ? 'Goal: '+(goals.length?goals.join(', '):emptyGoal)+'. '+(blockers.length?'What is getting in the way: '+blockers.join(', ')+'.':'You can add more context in your message.')
          : 'Цель: '+(goals.length?goals.join(', '):emptyGoal)+'. '+(blockers.length?'Что мешает: '+blockers.join(', ')+'.':'Подробности можно написать в сообщении.');
        summary.classList.toggle('mm-editorial-detail-quiz-ready', !!ready);
        summary.innerHTML = ready
          ? (en ? '<b>Your message is ready.</b><span class="mm-editorial-detail-thank-note">Check it in Telegram and send when ready.</span><span class="mm-editorial-detail-thank-note">'+line+'</span>' : '<b>Сообщение готово.</b><span class="mm-editorial-detail-thank-note">Проверьте его в Telegram и отправьте, когда будете готовы.</span><span class="mm-editorial-detail-thank-note">'+line+'</span>')
          : (en ? 'You can send the message now or add a goal above.' : 'Можно отправить сообщение сразу или выбрать цель выше.');
      }
      if(tg) { tg.href='https://t.me/markovmade?text='+encodeURIComponent(text); tg.textContent = en ? 'Message Pavel' : 'Написать Павлу'; }
      if(wa) { wa.href='https://wa.me/79819722516?text='+encodeURIComponent(text); }
    }
    window.mmV13QuizUpdate = update;
    root.querySelectorAll('.mm-editorial-option').forEach(function(btn){
      btn.addEventListener('click',function(){
        var group=btn.closest('[data-quiz-group]');
        var wasActive=btn.classList.contains('active');
        group.querySelectorAll('.mm-editorial-option').forEach(function(option){
          option.classList.remove('active');
          option.setAttribute('aria-pressed','false');
        });
        if(!wasActive){btn.classList.add('active');btn.setAttribute('aria-pressed','true');}
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
