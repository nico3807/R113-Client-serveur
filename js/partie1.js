// Partie 1 : URL décortiquée, quiz des ports, animation client / DNS /
// serveur pas à pas, et petit terminal pour s'entraîner à ping / nslookup
// sur des domaines d'exemple (.test, réservés à cet usage : ils n'existent
// pas sur Internet).

(function () {
  var esc = TP.echapper;

  // ---------- URL décortiquée ----------
  var TEXTES_URL = {
    proto: '<strong>Le protocole</strong> (ou schéma) : il indique au navigateur <em>comment</em> dialoguer avec le serveur. Compare-le avec <code>http://</code> pour répondre à Q1.',
    sous: '<strong>Le sous-domaine</strong> : <code>www</code> désigne traditionnellement le service web du domaine. Il fait partie du nom de la machine.',
    domaine: '<strong>Le nom de domaine</strong> : le nom lisible par l\'humain. Le DNS le traduira en adresse IP (partie « Rôle du DNS »).',
    port: '<strong>Le port</strong> : après les deux-points, il désigne le service à joindre sur la machine. Il est d\'habitude implicite : le navigateur le déduit du protocole. Le quiz ci-dessous t\'aidera pour Q2.',
    chemin: '<strong>Le chemin</strong> : la ressource demandée sur le serveur (ici, la page de recherche).',
    requete: '<strong>Les paramètres</strong> (query string) : après le <code>?</code>, des couples clé=valeur envoyés au serveur. Ici <code>q</code> vaut « but mmi » (le <code>+</code> remplace l\'espace).'
  };
  var url = document.getElementById('url-dissect');
  var urlExp = document.getElementById('url-explication');
  if (url && urlExp) {
    var montrer = function (span) {
      url.querySelectorAll('.u').forEach(function (s) {
        s.classList.toggle('on', s === span);
      });
      urlExp.innerHTML = TEXTES_URL[span.getAttribute('data-part')];
    };
    url.addEventListener('click', function (evt) {
      var s = evt.target.closest('.u');
      if (s) montrer(s);
    });
    url.addEventListener('keydown', function (evt) {
      var s = evt.target.closest('.u');
      if (s && (evt.key === 'Enter' || evt.key === ' ')) {
        evt.preventDefault();
        montrer(s);
      }
    });
  }

  // ---------- Quiz des ports ----------
  var ports = document.getElementById('ports');
  if (ports) {
    var etatPorts = TP.lire('ports', { faites: {} });
    var score = document.getElementById('ports-score');
    var verifier = function () {
      var bons = 0;
      ports.querySelectorAll('.port-item').forEach(function (it) {
        var sel = it.querySelector('select');
        if (!sel.value) {
          it.classList.remove('ok', 'ko');
          return;
        }
        var ok = sel.value === it.getAttribute('data-port');
        it.classList.toggle('ok', ok);
        it.classList.toggle('ko', !ok);
        if (ok) {
          bons++;
          etatPorts.faites[it.getAttribute('data-service')] = true;
        }
      });
      TP.ecrire('ports', etatPorts);
      var total = ports.querySelectorAll('.port-item').length;
      score.textContent = bons + ' / ' + total + ' bonnes associations' + (bons === total ? ' 🎉' : '');
    };
    document.getElementById('ports-verifier').addEventListener('click', verifier);
  }

  // ---------- Animation client / DNS / serveur ----------
  var svg = document.getElementById('seq-svg');
  if (svg) {
    var paquet = document.getElementById('seq-paquet');
    var paquetTxt = document.getElementById('seq-paquet-txt');
    var etapes = document.querySelectorAll('#seq-etapes li');
    var legende = document.getElementById('seq-legende');
    var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // [départ, arrivée, étiquette, couleur, acteurs actifs]
    var SEGMENTS = [
      [[130, 70], [400, 70], 'www.mmi-demo.test ?', 'var(--accent-b)', ['seq-nav', 'seq-dns']],
      [[400, 90], [130, 90], '203.0.113.10', 'var(--accent-b)', ['seq-nav', 'seq-dns']],
      [[130, 170], [670, 170], 'connexion :443', 'var(--primary)', ['seq-nav', 'seq-web']],
      [[130, 210], [670, 210], 'GET /', 'var(--accent-a)', ['seq-nav', 'seq-web']],
      [[670, 250], [130, 250], '200 OK + HTML', 'var(--ok)', ['seq-nav', 'seq-web']]
    ];
    var courante = -1;
    var enCours = false;

    var animer = function (i) {
      var seg = SEGMENTS[i];
      enCours = true;
      svg.querySelectorAll('.acteur').forEach(function (a) {
        a.classList.toggle('actif', seg[4].indexOf(a.id) !== -1);
      });
      etapes.forEach(function (li, k) {
        li.classList.toggle('on', k === i);
        li.classList.toggle('passe', k < i);
      });
      legende.textContent = 'Étape ' + (i + 1) + ' / ' + SEGMENTS.length;
      paquet.setAttribute('fill', seg[3]);
      paquetTxt.textContent = seg[2];
      paquet.style.opacity = 1;
      paquetTxt.style.opacity = 1;
      var t0 = null;
      var duree = reduit ? 1 : 1300;
      var pas = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / duree);
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var x = seg[0][0] + (seg[1][0] - seg[0][0]) * e;
        var y = seg[0][1] + (seg[1][1] - seg[0][1]) * e;
        paquet.setAttribute('cx', x);
        paquet.setAttribute('cy', y);
        paquetTxt.setAttribute('x', x);
        paquetTxt.setAttribute('y', y - 12);
        if (p < 1) requestAnimationFrame(pas);
        else enCours = false;
      };
      requestAnimationFrame(pas);
    };

    document.getElementById('seq-suivant').addEventListener('click', function () {
      if (enCours) return;
      courante = (courante + 1) % SEGMENTS.length;
      animer(courante);
      this.textContent = courante === SEGMENTS.length - 1 ? '↺ Recommencer' : '▶ Étape suivante';
    });
  }

  // ---------- Terminal ping / nslookup ----------
  var term = document.getElementById('terminal-dns');
  if (!term) return;

  // Domaines d'exemple en .test (TLD réservé, inexistant sur Internet) et
  // adresses IP réservées à la documentation (RFC 5737).
  var HOTES = {
    'www.mmi-demo.test': '203.0.113.10',
    'mmi-demo.test': '203.0.113.10',
    'boutique.test': '198.51.100.27',
    'www.boutique.test': '198.51.100.27',
    'serveur.iut.test': '192.0.2.80'
  };
  var etat = TP.lire('dns', { faites: {} });
  var style = TP.lire('dns-style', 'unix');

  term.classList.add('terminal');
  term.innerHTML =
    '<div class="terminal-barre"><span class="pastille"></span><span class="pastille"></span><span class="pastille"></span>' +
    '<span class="titre">Terminal d\'entraînement — ping / nslookup</span>' +
    '<button type="button" data-style title="Changer le format d\'affichage">Format : <span></span></button></div>' +
    '<div class="terminal-ecran" role="log" aria-live="polite"><div class="sortie"></div>' +
    '<label class="terminal-saisie"><span class="prompt"><span class="t-prompt-user">etudiant@mmi</span>:<span class="t-prompt-path">~</span>$ </span>' +
    '<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Commande à exécuter" /></label></div>' +
    '<div class="terminal-aide">Essaie <code>ping www.mmi-demo.test</code>, <code>nslookup boutique.test</code>, <code>ping inconnu.test</code> · <kbd>↑</kbd> historique · <code>clear</code></div>';
  var ecran = term.querySelector('.terminal-ecran');
  var sortie = term.querySelector('.sortie');
  var input = term.querySelector('input');
  var hist = [];
  var pos = 0;
  var occupe = false;

  var majStyle = function () {
    term.querySelector('[data-style] span').textContent = style === 'unix' ? 'macOS / Linux' : 'Windows';
  };
  majStyle();
  term.querySelector('[data-style]').addEventListener('click', function () {
    style = style === 'unix' ? 'windows' : 'unix';
    TP.ecrire('dns-style', style);
    majStyle();
  });

  var ligne = function (txt, classe) {
    var d = document.createElement('div');
    d.className = 'ligne';
    d.innerHTML = classe ? '<span class="' + classe + '">' + esc(txt) + '</span>' : esc(txt);
    sortie.appendChild(d);
    ecran.scrollTop = ecran.scrollHeight;
  };
  var mission = function (id, txt) {
    if (etat.faites[id]) return;
    etat.faites[id] = true;
    TP.ecrire('dns', etat);
    document.querySelectorAll('[data-mission="' + id + '"]').forEach(function (li) {
      li.classList.add('faite');
    });
    ligne('✔ ' + txt, 't-ok');
  };
  Object.keys(etat.faites).forEach(function (id) {
    document.querySelectorAll('[data-mission="' + id + '"]').forEach(function (li) {
      li.classList.add('faite');
    });
  });

  var vraiDomaine = function (h) {
    ligne('💡 Ce simulateur ne connaît que des domaines d\'exemple en .test (www.mmi-demo.test, boutique.test, serveur.iut.test).', 't-aide');
    ligne('   Pour « ' + h + ' », lance la commande dans ton VRAI terminal : c\'est elle qui compte pour Q4 !', 't-aide');
  };

  var ping = function (h, fin) {
    var ip = HOTES[h];
    if (!ip) {
      if (/\.test$/.test(h)) {
        ligne(style === 'unix' ? 'ping: cannot resolve ' + h + ': Unknown host'
          : 'La requête Ping n\'a pas pu trouver l\'hôte ' + h + '. Vérifiez le nom et essayez à nouveau.', 't-err');
        ligne('💡 Le DNS ne connaît aucune adresse IP pour ce nom : impossible de joindre la machine.', 't-aide');
        mission('dns-inconnu', 'Sans réponse du DNS, pas de communication possible.');
      } else vraiDomaine(h);
      return fin();
    }
    var n = 0;
    var temps = [];
    if (style === 'unix') ligne('PING ' + h + ' (' + ip + '): 56 data bytes');
    else {
      ligne('');
      ligne('Envoi d\'une requête \'ping\' sur ' + h + ' [' + ip + '] avec 32 octets de données :');
    }
    var t = setInterval(function () {
      var ms = (12 + Math.random() * 9).toFixed(style === 'unix' ? 3 : 0);
      temps.push(+ms);
      ligne(style === 'unix'
        ? '64 bytes from ' + ip + ': icmp_seq=' + n + ' ttl=56 time=' + ms + ' ms'
        : 'Réponse de ' + ip + ' : octets=32 temps=' + ms + ' ms TTL=56');
      if (++n >= 4) {
        clearInterval(t);
        var min = Math.min.apply(null, temps), max = Math.max.apply(null, temps);
        var moy = temps.reduce(function (a, b) { return a + b; }, 0) / 4;
        if (style === 'unix') {
          ligne('');
          ligne('--- ' + h + ' ping statistics ---');
          ligne('4 packets transmitted, 4 packets received, 0.0% packet loss');
          ligne('round-trip min/avg/max = ' + min.toFixed(3) + '/' + moy.toFixed(3) + '/' + max.toFixed(3) + ' ms');
        } else {
          ligne('');
          ligne('Statistiques Ping pour ' + ip + ':');
          ligne('    Paquets : envoyés = 4, reçus = 4, perdus = 0 (perte 0%),');
          ligne('Durée approximative des boucles en millisecondes :');
          ligne('    Minimum = ' + min + 'ms, Maximum = ' + max + 'ms, Moyenne = ' + Math.round(moy) + 'ms');
        }
        mission('dns-ping', 'Repère l\'adresse IP affichée AVANT les réponses : c\'est le DNS qui l\'a fournie.');
        fin();
      }
    }, 600);
  };

  var nslookup = function (h) {
    var ip = HOTES[h];
    ligne('Server:\t\t192.0.2.53');
    ligne('Address:\t192.0.2.53#53');
    ligne('');
    if (!ip) {
      if (/\.test$/.test(h)) {
        ligne('** server can\'t find ' + h + ': NXDOMAIN', 't-err');
        mission('dns-inconnu', 'NXDOMAIN : ce nom de domaine n\'existe pas pour le DNS.');
      } else vraiDomaine(h);
      return;
    }
    ligne('Non-authoritative answer:');
    ligne('Name:\t' + h);
    ligne('Address: ' + ip);
    mission('dns-nslookup', 'nslookup interroge directement le serveur DNS (port 53).');
  };

  var executer = function (cmd) {
    var d = document.createElement('div');
    d.className = 'ligne';
    d.innerHTML = term.querySelector('.prompt').innerHTML + esc(cmd);
    sortie.appendChild(d);
    var mots = cmd.trim().split(/\s+/).filter(Boolean);
    if (cmd.trim()) {
      hist.push(cmd);
      pos = hist.length;
    }
    var fin = function () {
      occupe = false;
      input.disabled = false;
      input.focus();
      ecran.scrollTop = ecran.scrollHeight;
    };
    if (!mots.length) return fin();
    var c = mots[0].toLowerCase();
    var h = (mots.filter(function (m) { return m.charAt(0) !== '-'; })[1] || '').toLowerCase()
      .replace(/^https?:\/\//, '').replace(/[\/:].*$/, '');
    if (c === 'clear' || c === 'cls') {
      sortie.innerHTML = '';
      return fin();
    }
    if (c === 'help') {
      ligne('Commandes simulées : ping <domaine>, nslookup <domaine>, clear', 't-dim');
      return fin();
    }
    if (c !== 'ping' && c !== 'nslookup') {
      ligne('bash: ' + mots[0] + ': command not found', 't-err');
      ligne('💡 Ce terminal ne simule que ping et nslookup.', 't-aide');
      return fin();
    }
    if (!h) {
      ligne(c === 'ping' ? 'usage: ping <domaine>' : 'usage: nslookup <domaine>', 't-err');
      return fin();
    }
    if (c === 'ping') {
      occupe = true;
      input.disabled = true;
      ping(h, fin);
    } else {
      nslookup(h);
      fin();
    }
  };

  input.addEventListener('keydown', function (evt) {
    if (occupe) return;
    if (evt.key === 'Enter') {
      var v = input.value;
      input.value = '';
      executer(v);
    } else if (evt.key === 'ArrowUp' && hist.length) {
      evt.preventDefault();
      pos = Math.max(0, pos - 1);
      input.value = hist[pos];
    } else if (evt.key === 'ArrowDown' && hist.length) {
      evt.preventDefault();
      pos = Math.min(hist.length, pos + 1);
      input.value = hist[pos] || '';
    }
  });
  ecran.addEventListener('click', function () {
    if (!window.getSelection().toString()) input.focus();
  });
  ligne('Terminal simulé : seuls les domaines d\'exemple en .test répondent.', 't-dim');
})();
