/* No network request is made until the user follows the explicit share link. */
(function(){
  'use strict';
  window.mmPreviewShare=function(text,url){
    const en=document.documentElement.lang==='en',dialog=document.createElement('dialog');dialog.className='mm-share-preview';dialog.dataset.noTranslate='';dialog.setAttribute('aria-labelledby','mm-share-preview-title');
    const title=document.createElement('h2');title.id='mm-share-preview-title';title.textContent=en?'Review before sharing':'Проверьте перед отправкой';
    const note=document.createElement('p');note.textContent=en?'The text will be handed to the messenger only after you continue. You can edit it there before sending.':'Текст будет передан в мессенджер только после продолжения. Там вы сможете изменить его перед отправкой.';
    const content=document.createElement('pre');content.textContent=text;
    const proceed=document.createElement('a');proceed.className='mm-primary-cta';proceed.textContent=en?'Continue to messenger':'Перейти в мессенджер';proceed.href=url;proceed.target='_blank';proceed.rel='noopener noreferrer';
    const cancel=document.createElement('button');cancel.type='button';cancel.className='mm-secondary-cta';cancel.textContent=en?'Cancel':'Отмена';cancel.addEventListener('click',()=>dialog.close());
    dialog.append(title,note,content,proceed,cancel);document.body.append(dialog);const focus=document.activeElement;
    dialog.addEventListener('close',()=>{dialog.remove();focus?.focus();},{once:true});dialog.showModal();cancel.focus();
  };
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');if(!link||link.closest('.mm-share-preview'))return;
    let url;try{url=new URL(link.href);}catch{return;}
    if(!['t.me','wa.me'].includes(url.hostname)||!url.searchParams.has('text'))return;
    event.preventDefault();window.mmPreviewShare(url.searchParams.get('text'),url.href);
  },true);
})();
