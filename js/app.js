(function () {
  "use strict";

  var STORAGE_KEY = "berserk_memorial_age_ok";
  var DEMO_VIDEO_ID = "6QkMrXodGQQ";
  var EPISODE_COUNT = 25;
  /** Локальный файл через junction Web/media/berserkEPISODES → папка на рабочем столе. */
  var EP1_LOCAL_VIDEO =
    "media/berserkEPISODES/animevost_1-seriya-Berserk-720p.mp4";

  var portraitArt = {
    guts: function () {
      return '<img src="assets/guts.jpg"/>'
    },
    griffith: function () {
      return '<img src="assets/griffit2.jpg"/>'
    },
    casca: function () {
      return '<img src="assets/Kaska.jpg"/>'
    },
  };

  // Скрипт для кнопки авторизации 
document.addEventListener('DOMContentLoaded', function() {
  const authBtn = document.getElementById('authButton');
  
  if (authBtn) {
    authBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'auth.html';
    });
  }
});

  function qs(id) {
    return document.getElementById(id);
  }

  function buildParticles(container) {
    if (!container) return;
    var frag = document.createDocumentFragment();
    var colors = ["#8b1a1a", "#5c5c62", "#4a4a50", "#6b3030"];
    for (var i = 0; i < 48; i++) {
      var p = document.createElement("span");
      p.className = "particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 12 + Math.random() * 18 + "s";
      p.style.animationDelay = Math.random() * 10 + "s";
      p.style.background =
        Math.random() > 0.65 ? colors[0] : colors[1 + Math.floor(Math.random() * 3)];
      frag.appendChild(p);
    }
    container.appendChild(frag);
  }

  function updateScrollBlade() {
    var el = qs("scroll-blade");
    if (!el) return;
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    el.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }

  function setupAgeGate() {
    var gate = qs("age-gate");
    var ok = qs("age-confirm");
    var leave = qs("age-leave");
    try {
      var sp = new URLSearchParams(window.location.search);
      if (sp.has("reset_age")) {
        localStorage.removeItem(STORAGE_KEY);
        sp.delete("reset_age");
        var tail = sp.toString();
        window.history.replaceState(
          {},
          "",
          window.location.pathname + (tail ? "?" + tail : "") + window.location.hash
        );
      }
    } catch (e) {}

    function unlock() {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch (e) {}
      if (gate) gate.classList.add("is-hidden");
      document.body.classList.remove("is-locked");
    }

    if (localStorage.getItem(STORAGE_KEY) === "1") {
      if (gate) gate.classList.add("is-hidden");
    } else {
      document.body.classList.add("is-locked");
    }

    if (ok) ok.addEventListener("click", unlock);
    if (leave)
      leave.addEventListener("click", function () {
        window.location.href = "https://ru.wikipedia.org/wiki/Berserk";
      });
  }

  function hideLoader() {
    var loader = qs("page-loader");
    if (!loader) return;
    requestAnimationFrame(function () {
      loader.classList.add("is-done");
    });
  }

  function youtubeThumbUrl(videoId) {
    return "https://i.ytimg.com/vi/" + videoId + "/mqdefault.jpg";
  }

  var EPISODE_PREVIEW_FALLBACK =
    "assets/digital-art-eclipse-clouds-berserk-wallpaper-preview.jpg";

  function captureVideoFrameThumb(src, onDone) {
    var probe = document.createElement("video");
    probe.muted = true;
    probe.playsInline = true;
    probe.preload = "metadata";
    probe.src = src;

    function fail() {
      probe.removeAttribute("src");
      probe.load();
      onDone(null);
    }

    probe.addEventListener("error", fail);
    probe.addEventListener("loadedmetadata", function () {
      var t = Math.min(90, Math.max(1, probe.duration * 0.08));
      probe.currentTime = t;
    });
    probe.addEventListener("seeked", function () {
      try {
        var canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 180;
        var ctx = canvas.getContext("2d");
        if (!ctx) {
          fail();
          return;
        }
        ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
        onDone(canvas.toDataURL("image/jpeg", 0.82));
      } catch (err) {
        onDone(null);
      }
      probe.removeAttribute("src");
      probe.load();
    });
  }

  function isHotkeysBlocked() {
    var gate = qs("age-gate");
    if (gate && !gate.classList.contains("is-hidden")) return true;
    var modal = qs("modal-overlay");
    if (modal && modal.classList.contains("is-open")) return true;
    var el = document.activeElement;
    if (!el) return false;
    var tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  var SEEK_STEP_SEC = 10;

  function setupPlayerHotkeys(api) {
    document.addEventListener(
      "keydown",
      function (e) {
        if (isHotkeysBlocked()) return;
        if (!api.isLocalMode()) return;

        var key = e.key;
        if (key === "ArrowLeft") {
          e.preventDefault();
          api.seek(-SEEK_STEP_SEC);
          return;
        }
        if (key === "ArrowRight") {
          e.preventDefault();
          api.seek(SEEK_STEP_SEC);
          return;
        }
        if (key === " " || key === "Spacebar") {
          e.preventDefault();
          api.togglePlay();
          return;
        }
        if (e.code === "KeyF" || key === "f" || key === "F" || key === "ф" || key === "Ф") {
          e.preventDefault();
          api.toggleFullscreen();
        }
      },
      true
    );
  }

  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.webkitCurrentFullScreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function exitFullscreen() {
    var exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;
    if (!exit) return Promise.resolve();
    try {
      var p = exit.call(document);
      return p && typeof p.then === "function" ? p : Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  function requestFullscreen(el) {
    if (!el) return Promise.reject(new Error("no element"));
    var req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.webkitEnterFullscreen ||
      el.msRequestFullscreen;
    if (!req) return Promise.reject(new Error("unsupported"));
    try {
      var p = req.call(el);
      return p && typeof p.then === "function" ? p : Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  function togglePlayerFullscreen(video, wrap) {
    if (!video || !wrap || !wrap.classList.contains("is-local")) return;

    if (getFullscreenElement()) {
      exitFullscreen().catch(function () {});
      return;
    }

    if (video.webkitEnterFullscreen) {
      try {
        video.webkitEnterFullscreen();
        return;
      } catch (err) {}
    }

    var shell = qs("player-shell");
    requestFullscreen(video)
      .catch(function () {
        return requestFullscreen(wrap);
      })
      .catch(function () {
        if (shell) return requestFullscreen(shell);
      })
      .catch(function () {});
  }

  function renderEpisodes() {
    var grid = qs("episode-grid");
    if (!grid) return;
    var ytThumb = youtubeThumbUrl(DEMO_VIDEO_ID);
    var html = "";
    for (var n = 1; n <= EPISODE_COUNT; n++) {
      var thumbSrc = n === 1 ? EPISODE_PREVIEW_FALLBACK : ytThumb;
      html +=
        '<button type="button" class="episode-btn" data-ep="' +
        n +
        '" role="listitem">' +
        '<img class="episode-btn__thumb" src="' +
        thumbSrc +
        '" alt="" loading="lazy" decoding="async" data-ep-thumb="' +
        n +
        '" onerror="this.onerror=null;this.src=\'' +
        EPISODE_PREVIEW_FALLBACK +
        '\';" />' +
        '<span class="episode-btn__veil" aria-hidden="true"></span>' +
        '<span class="episode-btn__label">Серия</span>' +
        '<span class="episode-btn__num">' +
        n +
        "</span>" +
        "</button>";
    }
    grid.innerHTML = html;

    var ep1Thumb = grid.querySelector('[data-ep-thumb="1"]');
    if (ep1Thumb) {
      captureVideoFrameThumb(EP1_LOCAL_VIDEO, function (dataUrl) {
        if (dataUrl) ep1Thumb.src = dataUrl;
      });
    }

    var iframe = qs("yt-player");
    var video = qs("local-player");
    var wrap = qs("player-wrap");
    var caption = qs("player-caption");
    var prevBtn = qs("episode-prev");
    var nextBtn = qs("episode-next");
    var selectedEp = null;

    function updateNavButtons() {
      if (prevBtn) prevBtn.disabled = selectedEp === null || selectedEp <= 1;
      if (nextBtn) nextBtn.disabled = selectedEp !== null && selectedEp >= EPISODE_COUNT;
    }

    function applyEpisode(ep) {
      if (ep === 1) {
        if (iframe) iframe.setAttribute("hidden", "");
        if (wrap) wrap.classList.add("is-local");
        if (video) {
          video.removeAttribute("hidden");
          video.src = EP1_LOCAL_VIDEO;
          video.play().catch(function () {});
          requestAnimationFrame(function () {
            try {
              video.focus({ preventScroll: true });
            } catch (err) {}
          });
        }
        if (caption) {
          caption.textContent = "Серия 1";
        }
      } else {
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
          video.setAttribute("hidden", "");
        }
        if (wrap) wrap.classList.remove("is-local");
        if (iframe) {
          iframe.removeAttribute("hidden");
          iframe.src =
            "https://www.youtube.com/embed/" +
            DEMO_VIDEO_ID +
            "?rel=0&autoplay=1";
        }
        if (caption) {
          caption.textContent = "Серия " + ep;
        }
      }
    }

    function selectEpisode(ep) {
      var n = Math.max(1, Math.min(EPISODE_COUNT, ep));
      selectedEp = n;
      grid.querySelectorAll(".episode-btn").forEach(function (b) {
        b.classList.toggle(
          "is-active",
          parseInt(b.getAttribute("data-ep"), 10) === n
        );
      });
      applyEpisode(n);
      updateNavButtons();
      var activeBtn = grid.querySelector('.episode-btn[data-ep="' + n + '"]');
      if (activeBtn && typeof activeBtn.scrollIntoView === "function") {
        activeBtn.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    function prevEpisode() {
      if (selectedEp === null || selectedEp <= 1) return;
      selectEpisode(selectedEp - 1);
    }

    function nextEpisode() {
      if (selectedEp === null) {
        selectEpisode(1);
        return;
      }
      if (selectedEp >= EPISODE_COUNT) return;
      selectEpisode(selectedEp + 1);
    }

    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".episode-btn");
      if (!btn) return;
      var ep = parseInt(btn.getAttribute("data-ep"), 10);
      selectEpisode(ep);
    });

    if (prevBtn) prevBtn.addEventListener("click", prevEpisode);
    if (nextBtn) nextBtn.addEventListener("click", nextEpisode);

    if (wrap) {
      wrap.addEventListener("click", function () {
        if (!wrap.classList.contains("is-local") || !video) return;
        try {
          video.focus({ preventScroll: true });
        } catch (err) {}
      });
    }

    setupPlayerHotkeys({
      isLocalMode: function () {
        return wrap && wrap.classList.contains("is-local");
      },
      seek: function (deltaSec) {
        if (!video || !wrap.classList.contains("is-local")) return;
        var dur = video.duration;
        if (!isFinite(dur) || dur <= 0) return;
        var next = video.currentTime + deltaSec;
        video.currentTime = Math.max(0, Math.min(dur, next));
        try {
          video.focus({ preventScroll: true });
        } catch (err) {}
      },
      togglePlay: function () {
        if (!video || !wrap.classList.contains("is-local")) return;
        if (video.paused) video.play().catch(function () {});
        else video.pause();
        try {
          video.focus({ preventScroll: true });
        } catch (err) {}
      },
      toggleFullscreen: function () {
        togglePlayerFullscreen(video, wrap);
      },
    });

    updateNavButtons();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderCharacters(list) {
    var root = qs("characters-root");
    if (!root || !Array.isArray(list)) return;
    root.innerHTML = list
      .map(function (ch) {
        var artFn = portraitArt[ch.id] || portraitArt.guts;
        var art = artFn();
        return (
          '<article class="character-card" data-id="' +
          escapeHtml(ch.id) +
          '">' +
          '<div class="character-card__art">' +
          art +
          "</div>" +
          '<div class="character-card__body">' +
          '<h3 class="character-card__name">' +
          escapeHtml(ch.name) +
          " — " +
          escapeHtml(ch.title) +
          "</h3>" +
          '<p class="character-card__quote">«' +
          escapeHtml(ch.quote) +
          '»</p>' +
          '<button type="button" class="btn btn--angled js-open-scroll">Раскрыть свиток</button>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function openModal(ch) {
    var overlay = qs("modal-overlay");
    var body = qs("modal-body");
    if (!overlay || !body || !ch) return;

    var relHtml = (ch.relations || [])
      .map(function (r) {
        return (
          "<li><strong>" +
          escapeHtml(r.to) +
          ":</strong> " +
          escapeHtml(r.bond) +
          "</li>"
        );
      })
      .join("");

    var bioHtml = (ch.bio || [])
      .map(function (p) {
        return "<p>" + escapeHtml(p) + "</p>";
      })
      .join("");

    body.innerHTML =
      "<h2>" +
      escapeHtml(ch.name) +
      "</h2>" +
      '<p class="subtitle">' +
      escapeHtml(ch.title) +
      "</p>" +
      "<h3>Снаряжение</h3>" +
      "<p>" +
      escapeHtml(ch.weapon) +
      "</p>" +
      "<h3>Раса</h3>" +
      "<p>" +
      escapeHtml(ch.race) +
      "</p>" +
      "<h3>Биография</h3>" +
      bioHtml +
      "<h3>Связи</h3>" +
      '<ul class="relations-list">' +
      relHtml +
      "</ul>";

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");

    var inner = qs("modal-scroll-inner");
    if (inner) inner.scrollTop = 0;

    var closeBtn = qs("modal-close");
    if (closeBtn) {
      requestAnimationFrame(function () {
        closeBtn.focus({ preventScroll: true });
      });
    }
  }

  function closeModal() {
    var overlay = qs("modal-overlay");
    if (!overlay || !overlay.classList.contains("is-open")) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    var gate = qs("age-gate");
    if (!gate || gate.classList.contains("is-hidden")) {
      document.body.classList.remove("is-locked");
    }
  }

  function bindModal(rootId, charactersById) {
    var root = qs(rootId);
    var overlay = qs("modal-overlay");
    var closeBtn = qs("modal-close");
    var modalScroll = qs("modal-scroll");

    if (root) {
      root.addEventListener("click", function (e) {
        var card = e.target.closest(".character-card[data-id]");
        if (!card) return;
        var id = card.getAttribute("data-id");
        var ch = charactersById[id];
        if (!ch) return;
        e.preventDefault();
        openModal(ch);
      });
    }

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeModal();
      });
    }
    if (modalScroll) {
      modalScroll.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!overlay || !overlay.classList.contains("is-open")) return;
      e.preventDefault();
      closeModal();
    });
  }

  function loadCharacters() {
    return fetch("data/characters.json")
      .then(function (r) {
        if (!r.ok) throw new Error("characters");
        return r.json();
      })
      .catch(function () {
        return [];
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildParticles(qs("particles"));
    setupAgeGate();

    if (qs("episode-grid")) renderEpisodes();

    window.addEventListener("scroll", updateScrollBlade, { passive: true });
    window.addEventListener("resize", updateScrollBlade);
    updateScrollBlade();

    if (qs("characters-root")) {
      loadCharacters().then(function (list) {
        var map = {};
        list.forEach(function (c) {
          map[c.id] = c;
        });
        renderCharacters(list);
        bindModal("characters-root", map);
        hideLoader();
      });
    } else {
      hideLoader();
    }
  });
})();
