// Partie 2 : faux navigateur avec son onglet « Réseau » (requêtes, codes
// de statut, en-têtes, cookies) sur des sites d'exemple en .test, et
// décodage du User-Agent réel de l'étudiant·e.

(function () {
  var esc = TP.echapper;

  // ---------- Décodeur de User-Agent ----------
  var uaBloc = document.getElementById('ua');
  var uaExp = document.getElementById('ua-explication');
  if (uaBloc && uaExp) {
    var ua = navigator.userAgent;
    var expliquer = function (tok) {
      if (/^Mozilla\//.test(tok)) return 'Héritage historique : presque tous les navigateurs commencent par « Mozilla/5.0 » pour être compatibles avec de vieux serveurs.';
      if (/^\(/.test(tok) && /KHTML/.test(tok)) return 'Précision sur le moteur : « KHTML, like Gecko » est, lui aussi, une mention de compatibilité.';
      if (/^\(/.test(tok)) return 'Entre parenthèses : le <strong>système d\'exploitation</strong> et la plateforme (Windows NT 10.0 = Windows 10/11, Macintosh, X11/Linux, Android, iPhone...).';
      if (/^AppleWebKit\//.test(tok)) return 'Le <strong>moteur de rendu</strong> WebKit (ou Blink, son dérivé, chez Chrome et Edge), qui transforme le HTML/CSS en pixels.';
      if (/^Gecko\//.test(tok)) return 'Le moteur de rendu <strong>Gecko</strong>, celui de Firefox.';
      if (/^Edg\//.test(tok)) return 'Le <strong>navigateur</strong> : Microsoft Edge, et sa version.';
      if (/^(Headless)?Chrome\//.test(tok)) return 'Le <strong>navigateur</strong> Chrome (ou un navigateur basé sur Chromium) et sa version.';
      if (/^Firefox\//.test(tok)) return 'Le <strong>navigateur</strong> Firefox et sa version.';
      if (/^OPR\//.test(tok)) return 'Le <strong>navigateur</strong> Opera et sa version.';
      if (/^Version\//.test(tok)) return 'La version du navigateur Safari.';
      if (/^Safari\//.test(tok)) return 'Mention de compatibilité Safari (présente aussi chez Chrome et Edge).';
      if (/^Mobile/.test(tok)) return 'L\'appareil est un mobile : le serveur peut adapter la page.';
      return 'Un composant supplémentaire identifiant le navigateur ou l\'appareil.';
    };
    var tokens = ua.match(/\([^)]*\)|\S+/g) || [ua];
    uaBloc.innerHTML = tokens.map(function (t, i) {
      return '<button type="button" data-i="' + i + '">' + esc(t) + '</button>';
    }).join(' ');
    uaBloc.addEventListener('click', function (evt) {
      var b = evt.target.closest('button');
      if (!b) return;
      uaBloc.querySelectorAll('button').forEach(function (x) {
        x.classList.toggle('on', x === b);
      });
      uaExp.innerHTML = '<code>' + esc(b.textContent) + '</code> : ' + expliquer(b.textContent);
    });
  }

  // ---------- Faux navigateur + onglet Réseau ----------
  var sim = document.getElementById('devsim');
  if (!sim) return;

  var etat = TP.lire('reseau', { faites: {} });
  var cookies = {}; // cookies reçus, par domaine
  var requetes = [];
  var choisie = -1;
  var panier = 0;

  var IP = { 'www.mmi-demo.test': '203.0.113.10', 'mmi-demo.test': '203.0.113.10', 'boutique.test': '198.51.100.27', 'www.boutique.test': '198.51.100.27' };
  var STATUTS = { 200: 'OK', 301: 'Moved Permanently', 404: 'Not Found' };
  var TYPES = {
    document: 'text/html; charset=utf-8',
    stylesheet: 'text/css',
    png: 'image/png',
    script: 'text/javascript',
    fetch: 'application/json'
  };
  var ACCEPT = {
    document: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    stylesheet: 'text/css,*/*;q=0.1',
    png: 'image/avif,image/webp,image/png,*/*;q=0.8',
    script: '*/*',
    fetch: 'application/json'
  };

  var page = sim.querySelector('.devsim-page');
  var adresse = sim.querySelector('.devsim-barre input');
  var tbody = sim.querySelector('.devtools-liste tbody');
  var vide = sim.querySelector('.devtools-vide');
  var detail = sim.querySelector('.devtools-detail');
  var compteur = sim.querySelector('[data-compteur]');

  function mission(id) {
    if (etat.faites[id]) return;
    etat.faites[id] = true;
    TP.ecrire('reseau', etat);
    document.querySelectorAll('[data-mission="' + id + '"]').forEach(function (li) {
      li.classList.add('faite');
    });
  }
  Object.keys(etat.faites).forEach(function (id) {
    document.querySelectorAll('[data-mission="' + id + '"]').forEach(function (li) {
      li.classList.add('faite');
    });
  });

  function maintenant() {
    return new Date().toUTCString();
  }

  function requete(hote, chemin, type, statut, opts) {
    opts = opts || {};
    var reqH = {
      Host: hote,
      'User-Agent': navigator.userAgent,
      Accept: ACCEPT[type],
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
    };
    if (cookies[hote]) reqH.Cookie = cookies[hote];
    if (opts.methode === 'POST') reqH['Content-Type'] = 'application/json';
    var corps = opts.taille || (type === 'document' ? 4210 : type === 'png' ? 18342 : 1532);
    var resH = {
      Date: maintenant(),
      Server: 'Apache/2.4.62 (Debian)',
      'Content-Type': TYPES[type],
      'Content-Length': String(statut === 301 ? 0 : corps)
    };
    if (opts.location) resH.Location = opts.location;
    if (opts.setCookie) resH['Set-Cookie'] = opts.setCookie;
    if (type === 'document') resH['Cache-Control'] = 'no-cache';
    return {
      nom: opts.nom || (chemin === '/' ? hote : chemin.split('/').pop() || chemin),
      methode: opts.methode || 'GET',
      url: 'https://' + hote + chemin,
      statut: statut,
      type: type,
      taille: statut === 301 ? 0 : corps,
      ip: IP[hote] + ':443',
      reqH: reqH,
      resH: resH
    };
  }

  function rendreListe() {
    tbody.innerHTML = '';
    vide.hidden = requetes.length > 0;
    requetes.forEach(function (r, i) {
      var tr = document.createElement('tr');
      tr.className = 'e' + String(r.statut).charAt(0) + (i === choisie ? ' on' : '');
      tr.tabIndex = 0;
      tr.innerHTML = '<td>' + esc(r.nom) + '</td><td class="etat">' + r.statut + '</td><td>' + esc(r.methode) +
        '</td><td>' + r.type + '</td><td>' + (r.taille ? (r.taille / 1024).toFixed(1) + ' ko' : '0 o') + '</td>';
      tr.addEventListener('click', function () {
        choisir(i);
      });
      tr.addEventListener('keydown', function (evt) {
        if (evt.key === 'Enter') choisir(i);
      });
      tbody.appendChild(tr);
    });
    compteur.textContent = requetes.length + ' requête' + (requetes.length > 1 ? 's' : '');
  }

  function bloc(titre, obj, ouvert, clesHl) {
    var lignes = Object.keys(obj).map(function (k) {
      var hl = clesHl.indexOf(k) !== -1 ? ' class="hl"' : '';
      return '<div' + hl + ' style="display:contents"><dt>' + esc(k) + '</dt><dd>' + esc(obj[k]) + '</dd></div>';
    }).join('');
    return '<details' + (ouvert ? ' open' : '') + '><summary>' + titre + '</summary><dl>' + lignes + '</dl></details>';
  }

  function choisir(i) {
    choisie = i;
    var r = requetes[i];
    rendreListe();
    var hl = ['User-Agent', 'Content-Type', 'Set-Cookie', 'Cookie', 'Location'];
    detail.innerHTML =
      bloc('Général', {
        'URL de la requête': r.url,
        'Méthode de requête': r.methode,
        "Code d'état": r.statut + ' ' + STATUTS[r.statut],
        'Adresse distante': r.ip
      }, true, []) +
      bloc('En-têtes de réponse (Response Headers)', r.resH, true, hl) +
      bloc('En-têtes de requête (Request Headers)', r.reqH, true, hl);
    if (r.type === 'document' && r.statut === 200) mission('r-headers');
    if (r.resH['Set-Cookie']) mission('r-setcookie');
    if (r.methode === 'POST' && r.reqH.Cookie) mission('r-cookie');
  }

  function naviguer(saisie) {
    var u = saisie.trim().replace(/^https?:\/\//i, '');
    if (!u) return;
    var coupe = u.indexOf('/');
    var hote = (coupe === -1 ? u : u.slice(0, coupe)).toLowerCase().replace(/:\d+$/, '');
    var chemin = coupe === -1 ? '/' : u.slice(coupe);
    adresse.value = 'https://' + hote + chemin;
    // Comme dans un vrai navigateur, une nouvelle page vide la liste
    // (sauf si l'option « Conserver le journal » est cochée).
    requetes = [];
    choisie = -1;
    detail.innerHTML = '<p class="devtools-vide">Clique sur une requête pour voir ses en-têtes.</p>';

    if (!IP[hote]) {
      if (/\.test$/.test(hote)) {
        page.innerHTML = '<h1>Ce site est inaccessible</h1><p class="erreur">Impossible de trouver l\'adresse IP du serveur de ' + esc(hote) + '.</p><p><small>DNS_PROBE_FINISHED_NXDOMAIN</small></p>';
      } else {
        page.innerHTML = '<h1>Site réel</h1><p>Ce navigateur d\'entraînement ne charge que les sites d\'exemple proposés ci-dessus.</p><p>Pour <strong>' + esc(hote) + '</strong>, utilise ton vrai navigateur avec ses outils de développement : c\'est là que se font les observations du TP.</p>';
      }
      rendreListe();
      return;
    }

    if (hote.indexOf('boutique') !== -1) {
      panier = 0;
      var nouveau = !cookies[hote];
      var r0 = requete(hote, '/', 'document', 200, nouveau ? {
        setCookie: 'panier_id=' + Math.random().toString(36).slice(2, 10) + '; Path=/; Secure; HttpOnly; SameSite=Lax'
      } : {});
      requetes.push(r0);
      if (nouveau) cookies[hote] = r0.resH['Set-Cookie'].split(';')[0];
      requetes.push(requete(hote, '/css/boutique.css', 'stylesheet', 200));
      requetes.push(requete(hote, '/img/tshirt-mmi.png', 'png', 200));
      page.innerHTML = '<h1>🛍️ Boutique MMI</h1><p>T-shirt MMI Béziers · 15 €</p>' +
        '<p><button type="button" data-ajouter>Ajouter au panier</button> <span data-panier>Panier : 0 article</span></p>' +
        '<p><small>Tu n\'es pas connecté·e : le serveur te reconnaît pourtant d\'une requête à l\'autre…</small></p>';
      page.querySelector('[data-ajouter]').addEventListener('click', function () {
        panier++;
        requetes.push(requete(hote, '/api/panier', 'fetch', 200, { methode: 'POST', nom: 'panier', taille: 64 }));
        page.querySelector('[data-panier]').textContent = 'Panier : ' + panier + ' article' + (panier > 1 ? 's' : '');
        rendreListe();
      });
      mission('r-200');
      rendreListe();
      return;
    }

    if (chemin === '/ancienne-page') {
      requetes.push(requete(hote, chemin, 'document', 301, { location: 'https://' + hote + '/' }));
      chemin = '/';
      adresse.value = 'https://' + hote + '/';
    }
    if (chemin === '/' || chemin === '/index.html') {
      requetes.push(requete(hote, chemin, 'document', 200));
      requetes.push(requete(hote, '/css/style.css', 'stylesheet', 200));
      requetes.push(requete(hote, '/img/logo.png', 'png', 200));
      requetes.push(requete(hote, '/js/app.js', 'script', 200));
      page.innerHTML = '<h1>Bienvenue sur MMI Démo</h1><p>Un site d\'exemple pour observer les échanges HTTP.</p>';
      mission('r-200');
    } else {
      requetes.push(requete(hote, chemin, 'document', 404, { taille: 1210 }));
      requetes.push(requete(hote, '/css/style.css', 'stylesheet', 200));
      page.innerHTML = '<h1>404 Not Found</h1><p class="erreur">La page « ' + esc(chemin) + ' » n\'existe pas sur ce serveur.</p>';
      mission('r-404');
    }
    rendreListe();
  }

  sim.querySelector('.devsim-barre form').addEventListener('submit', function (evt) {
    evt.preventDefault();
    naviguer(adresse.value);
  });
  sim.querySelectorAll('[data-aller]').forEach(function (b) {
    b.addEventListener('click', function () {
      naviguer(b.getAttribute('data-aller'));
    });
  });
  sim.querySelector('.effacer').addEventListener('click', function () {
    requetes = [];
    choisie = -1;
    detail.innerHTML = '<p class="devtools-vide">Clique sur une requête pour voir ses en-têtes.</p>';
    rendreListe();
    mission('r-effacer');
  });
  rendreListe();
})();
