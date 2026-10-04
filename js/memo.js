// Page Mémo : filtre des tableaux, boutons « copier » et quiz « ports,
// codes et en-têtes ».

(function () {
  // ---------- Filtre ----------
  var filtre = document.getElementById('filtre');
  if (filtre) {
    filtre.addEventListener('input', function () {
      var q = filtre.value.trim().toLowerCase();
      document.querySelectorAll('[data-filtrable] tbody tr').forEach(function (tr) {
        tr.hidden = q && tr.textContent.toLowerCase().indexOf(q) === -1;
      });
    });
  }

  // ---------- Copier une commande ----------
  document.querySelectorAll('[data-copie]').forEach(function (code) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'copier';
    b.textContent = 'copier';
    b.setAttribute('aria-label', 'Copier ' + code.textContent);
    b.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(code.textContent).then(function () {
        b.textContent = 'copié ✔';
        setTimeout(function () {
          b.textContent = 'copier';
        }, 1500);
      });
    });
    code.insertAdjacentElement('afterend', b);
  });

  // ---------- Quiz « quelle commande ? » ----------
  var QUIZ = [
    { q: 'Port par défaut du protocole HTTP (non sécurisé) ?', r: ['80'] },
    { q: 'Port par défaut du protocole HTTPS ?', r: ['443'] },
    { q: 'Port du service DNS ?', r: ['53'] },
    { q: 'Code de statut : tout s\'est bien passé.', r: ['200'] },
    { q: 'Code de statut : la ressource n\'existe pas sur le serveur.', r: ['404'] },
    { q: 'Code de statut : la page a déménagé définitivement (redirection).', r: ['301'] },
    { q: 'Code de statut : erreur interne du serveur.', r: ['500'] },
    { q: 'Commande qui interroge directement un serveur DNS.', r: ['nslookup'] },
    { q: 'En-tête de réponse qui indique le type du contenu (HTML, image...).', r: ['content-type'] },
    { q: 'En-tête de requête qui décrit le navigateur et le système.', r: ['user-agent'] },
    { q: 'En-tête de réponse par lequel le serveur dépose un cookie.', r: ['set-cookie'] },
    { q: 'Raccourci le plus courant pour ouvrir les outils de développement (Windows).', r: ['f12'] }
  ];

  var bloc = document.getElementById('quiz-cmd');
  if (!bloc) return;
  var enonce = bloc.querySelector('.q-enonce');
  var input = bloc.querySelector('input');
  var fb = bloc.querySelector('.feedback');
  var compte = bloc.querySelector('.q-compte');
  var ordre = QUIZ.map(function (_, i) {
    return i;
  }).sort(function () {
    return Math.random() - 0.5;
  });
  var pos = 0;
  var bons = 0;
  var essaye = false;

  function afficher() {
    if (pos >= ordre.length) {
      enonce.textContent = 'Terminé : ' + bons + ' / ' + ordre.length + ' du premier coup. Recharge la page pour rejouer.';
      bloc.querySelector('form').hidden = true;
      return;
    }
    enonce.textContent = QUIZ[ordre[pos]].q;
    compte.textContent = 'Question ' + (pos + 1) + ' / ' + ordre.length;
    input.value = '';
    essaye = false;
  }

  bloc.querySelector('form').addEventListener('submit', function (evt) {
    evt.preventDefault();
    var item = QUIZ[ordre[pos]];
    var rep = input.value.trim().replace(/\s+/g, ' ').toLowerCase();
    if (item.r.indexOf(rep) !== -1) {
      if (!essaye) bons++;
      fb.className = 'feedback ok';
      fb.textContent = '✔ Exact : ' + rep;
      pos++;
      afficher();
    } else {
      essaye = true;
      fb.className = 'feedback ko';
      fb.textContent = '✖ Pas tout à fait. Réponse attendue : ' + item.r[0] + ' (retape-la pour continuer).';
    }
  });

  afficher();
})();
