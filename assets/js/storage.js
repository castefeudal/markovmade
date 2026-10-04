(function(){
  'use strict';
  window.mmSafeStorage = window.mmSafeStorage || {
    get: function(key, fallback){
      try {
        var value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (e) { return fallback; }
    },
    set: function(key, value){
      try { window.localStorage.setItem(key, String(value)); return true; }
      catch (e) { return false; }
    },
    remove: function(key){
      try { window.localStorage.removeItem(key); return true; }
      catch (e) { return false; }
    }
  };
})();
