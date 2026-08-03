
// V15 · Routing depuis le splash d'entrée
function enterEntity(entity) {
  // On retient la sélection en mémoire de session (pas obligatoire mais améliore l'UX)
  try { sessionStorage.setItem('bci_entity', entity); } catch(e) {}

  if (entity === 'elec') {
    // Bascule vers la page Elec Particuliers
    showPage('elec-part');
    window.scrollTo({top: 0, behavior: 'smooth'});
  } else {
    // Patrimoine : on scrolle vers la section hero existante (Patrimétrologie)
    const hero = document.querySelector('#page-home .hero');
    if (hero) {
      hero.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }
}

// Permettre de revenir au splash via clic sur le logo


function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navMap = {
    'home': 'nav-home',
    'patrim': 'nav-patrim',
    'prescript': 'nav-prescript',
    'elec-part': 'nav-elec-part',
    'elec-pro': 'nav-elec-pro'
  };
  if (navMap[page]) {
    const navEl = document.getElementById(navMap[page]);
    if (navEl) navEl.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  try { history.replaceState(null, '', page === 'home' ? location.pathname : '#' + page); } catch (e) {}
}

function scrollToSection(id) {
  var el = document.getElementById(id);
  if (!el) { console.warn('Section absente : ' + id); return; }
  var page = el.closest ? el.closest('.page') : null;
  if (page && !page.classList.contains('active')) {
    showPage(page.id.replace('page-', ''));
    setTimeout(function () { el.scrollIntoView({ behavior: 'smooth' }); }, 130);
    return;
  }
  el.scrollIntoView({ behavior: 'smooth' });
}









// Ω animated counter
const omegaNum = document.getElementById('omegaNum');
if (omegaNum) {
let current = 0;
const target = 76;
const duration = 2000;
const start = Date.now();
function animate() {
  const elapsed = Date.now() - start;
  const progress = Math.min(elapsed / duration, 1);
  current = Math.floor(target * (1 - Math.pow(1 - progress, 3)));
  omegaNum.textContent = current;
  if (progress < 1) requestAnimationFrame(animate);
}
setTimeout(animate, 500);
}

// Sticky CTA visibility
const stickyCta = document.getElementById('stickyCta');
window.addEventListener('scroll', () => {
  if (!stickyCta) return;
  if (window.scrollY > 800) {
    stickyCta.classList.add('visible');
  } else {
    stickyCta.classList.remove('visible');
  }
});

// ========== V10 - Anti-spam & form validation ==========

// Generate random math captcha for each form
function generateCaptchas() {
  const generate = (q1Id, q2Id) => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const e1 = document.getElementById(q1Id), e2 = document.getElementById(q2Id);
    if (!e1 || !e2) return null;
    e1.textContent = a; e2.textContent = b;
    return a + b;
  };
  window._captchaAnswers = {
    lead: generate('captchaQ1', 'captchaQ2'),
    contact: generate('contactCaptchaQ1', 'contactCaptchaQ2'),
    book: generate('bookCaptchaQ1', 'bookCaptchaQ2')
  };
}

// Validate form against spam (honeypot + captcha + rate limit)
function validateAntiSpam(form, captchaType) {
  // Honeypot check
  const honeypot = form.querySelector('input[name="website_url"]');
  if (honeypot && honeypot.value !== '') {
    console.warn('Honeypot filled - spam blocked');
    return false; // Silent fail for bots
  }

  // Captcha check
  const captchaInput = form.querySelector('input[name="captcha"]');
  if (captchaInput) {
    const expected = window._captchaAnswers[captchaType];
    const provided = parseInt(captchaInput.value, 10);
    if (provided !== expected) {
      alert('Vérification anti-robot incorrecte. Veuillez recalculer le résultat.');
      generateCaptchas();
      return false;
    }
  }

  // Rate limiting (1 submission per 30 sec per form)
  const lastKey = `bci_lastSubmit_${captchaType}`;
  const lastSubmit = parseInt(localStorage.getItem(lastKey) || '0', 10);
  if (Date.now() - lastSubmit < 30000) {
    alert('Merci de patienter 30 secondes avant un nouvel envoi.');
    return false;
  }
  localStorage.setItem(lastKey, Date.now().toString());

  return true;
}

// Form submissions (with anti-spam)
// ========== TRAITEMENT DES FORMULAIRES ==========
// Remplace le comportement de simulation de la v19, qui affichait
// « Demande envoyee avec succes » sans rien envoyer.
//
// Envoi reel via Web3Forms : le courriel arrive dans votre boite, mis en forme,
// avec l'adresse du prospect en repondre-a. Aucune installation, aucun serveur.
//
// ---------------------------------------------------------------------------
// A RENSEIGNER : creer une cle gratuite sur web3forms.com (une adresse courriel
// suffit, aucune carte bancaire). Une cle par adresse de destination.
// ---------------------------------------------------------------------------
var CLE_PATRIMOINE = '';   // cle liee a contact@bcorpinternational.com
var CLE_ELEC       = '';   // cle liee a elec@bcorpinternational.com

// Repli si la cle correspondante n'est pas encore renseignee : la demande passe
// par le logiciel de messagerie du visiteur. Solution d'attente, a desactiver
// des que les cles sont en place.
var REPLI_MESSAGERIE = true;

var DEST_PATRIMOINE = 'contact@bcorpinternational.com';
var DEST_ELEC       = 'elec@bcorpinternational.com';
var TEL_BCI         = '06 01 46 83 84';

// ---------- CONFIGURATION BREVO (formulaire du guide) ----------
// Creer le formulaire sur brevo.com, puis coller ici son URL d'action.
// Procedure detaillee dans BCI_Branchement_Brevo.md.
var BREVO_FORM_URL = 'A_REMPLACER_PAR_URL_BREVO';

var LIBELLES = {
  nom: 'Nom', prenom: 'Prenom', email: 'Courriel', telephone: 'Telephone',
  besoin: 'Nature du besoin', delai: 'Delai souhaite', patrimoine: 'Patrimoine estime',
  adresse: 'Adresse du chantier', message: 'Message', livre: 'Ouvrage'
};

function champsDuFormulaire(form) {
  var out = [];
  Array.prototype.forEach.call(form.elements, function (el) {
    if (!el.name || el.type === 'submit' || el.type === 'checkbox') { return; }
    if (el.name === 'website_url' || el.name === 'captcha') { return; }
    if (!el.value) { return; }
    out.push({ cle: el.name, libelle: LIBELLES[el.name] || el.name, valeur: el.value });
  });
  return out;
}

function valeurChamp(champs, cle) {
  for (var i = 0; i < champs.length; i++) {
    if (champs[i].cle === cle) { return champs[i].valeur; }
  }
  return '';
}

function corpsLisible(champs, entite) {
  var NL = String.fromCharCode(10);
  var lignes = [];
  lignes.push('DEMANDE RECUE VIA ' + entite.toUpperCase());
  lignes.push('Recue le ' + new Date().toLocaleString('fr-FR'));
  lignes.push('');
  champs.forEach(function (c) { lignes.push(c.libelle + ' : ' + c.valeur); });
  lignes.push('');
  lignes.push('Formulaire du site bcorpinternational.com');
  return lignes.join(NL);
}

function envoyerDemande(form, options) {
  var champs      = champsDuFormulaire(form);
  var btn         = form.querySelector('button[type="submit"]');
  var libelleBtn  = btn ? btn.innerHTML : '';
  var nomComplet  = ((valeurChamp(champs, 'prenom') + ' ' + valeurChamp(champs, 'nom')).trim()) || 'Prospect';
  var courriel    = valeurChamp(champs, 'email');
  var corps       = corpsLisible(champs, options.entite);

  if (options.cle) {
    if (btn) { btn.innerHTML = 'Envoi en cours...'; btn.disabled = true; }
    var charge = {
      access_key: options.cle,
      subject: options.objet + ' - ' + nomComplet,
      from_name: options.entite,
      replyto: courriel,
      message: corps
    };
    champs.forEach(function (c) { charge[c.libelle] = c.valeur; });

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(charge)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || data.success !== true) { throw new Error('refus du service'); }
        alert('Votre demande a bien ete transmise. Vous serez recontacte sous 24 heures ouvrees.');
        form.reset();
        generateCaptchas();
        if (options.type === 'book') { closeModal('book'); }
      })
      .catch(function () {
        alert("L'envoi automatique a echoue. Ecrivez-nous a " + options.destinataire
            + ' ou appelez le ' + TEL_BCI + '.');
      })
      .then(function () { if (btn) { btn.innerHTML = libelleBtn; btn.disabled = false; } });
    return;
  }

  if (REPLI_MESSAGERIE) {
    window.location.href = 'mailto:' + options.destinataire
      + '?subject=' + encodeURIComponent(options.objet + ' - ' + nomComplet)
      + '&body=' + encodeURIComponent(corps);
    alert("Votre logiciel de messagerie s'ouvre avec la demande pre-remplie. "
        + "Cliquez sur Envoyer pour la transmettre. "
        + "Si rien ne s'ouvre, ecrivez a " + options.destinataire + ' ou appelez le ' + TEL_BCI + '.');
    return;
  }

  alert('Le formulaire est momentanement indisponible. Ecrivez-nous a '
      + options.destinataire + ' ou appelez le ' + TEL_BCI + '.');
}

function submitForm(form) {
  if (!validateAntiSpam(form, 'contact')) { return; }
  var elec = form.id === 'contactFormElec';
  envoyerDemande(form, {
    cle:          elec ? CLE_ELEC : CLE_PATRIMOINE,
    destinataire: elec ? DEST_ELEC : DEST_PATRIMOINE,
    entite:       elec ? 'BCI Elec' : 'BCI Patrimoine et Finance',
    objet:        elec ? 'Demande de devis' : 'Demande de contact',
    type:         'contact'
  });
}

function submitLead(form) {
  if (!validateAntiSpam(form, 'lead')) { return; }
  if (BREVO_FORM_URL && BREVO_FORM_URL.indexOf('REMPLACER') === -1) {
    var email  = form.querySelector('[name="email"]').value;
    var btn    = form.querySelector('button[type="submit"]');
    var etiq   = btn.innerHTML;
    btn.innerHTML = 'Envoi en cours...';
    btn.disabled  = true;
    var fd = new FormData();
    fd.append('EMAIL', email);
    fd.append('OPT_IN', '1');
    fd.append('email_address_check', '');
    fd.append('locale', 'fr');
    fetch(BREVO_FORM_URL, { method: 'POST', body: fd, mode: 'no-cors' })
      .then(function () {
        alert('Merci. Vous allez recevoir le guide par courriel dans quelques minutes. Pensez a verifier votre dossier indesirable.');
        form.reset();
        generateCaptchas();
      })
      .catch(function () {
        alert('Une erreur est survenue. Ecrivez-nous a ' + DEST_PATRIMOINE + '.');
      })
      .then(function () { btn.innerHTML = etiq; btn.disabled = false; });
    return;
  }
  envoyerDemande(form, {
    cle: CLE_PATRIMOINE, destinataire: DEST_PATRIMOINE,
    entite: 'BCI Patrimoine et Finance',
    objet: 'Demande du guide - 5 angles morts', type: 'lead'
  });
}

// Ouverture de la modale de reservation d'ouvrage, depuis la section Livres.
function openBookForm(livre) {
  var titres = {
    'manifeste':     'Pre-commander le Manifeste',
    'indice-omega':  "Alerte parution - L'indice omega",
    'cas-pratiques': "S'inscrire - 20 cas pratiques"
  };
  var soustitres = {
    'manifeste':     'Reservez votre exemplaire du manifeste fondateur de la Patrimetrologie. Parution automne 2026. Envoi prioritaire aux pre-commandes.',
    'indice-omega':  "Soyez alerte des la parution du cahier technique de l'indice omega (edition 2027). Tirage limite, reserve aux praticiens.",
    'cas-pratiques': 'Inscrivez-vous pour recevoir un extrait gratuit et etre prevenu de la parution du recueil de 20 cas pratiques (edition 2027).'
  };
  var t  = document.getElementById('bookModalTitle');
  var st = document.getElementById('bookModalSubtitle');
  var lv = document.getElementById('bookFormLivre');
  if (t)  { t.textContent  = titres[livre] || 'Reserver mon exemplaire'; }
  if (st) { st.textContent = soustitres[livre] || ''; }
  if (lv) { lv.value = livre; }
  openModal('book');
}

function submitBookForm(form) {
  if (!validateAntiSpam(form, 'book')) { return; }
  envoyerDemande(form, {
    cle: CLE_PATRIMOINE, destinataire: DEST_PATRIMOINE,
    entite: 'BCI Patrimoine et Finance',
    objet: "Reservation d'ouvrage", type: 'book'
  });
}

// V10 - Cookie banner
function showCookieBanner() {
  const b = document.getElementById('cookieBanner');
  if (b && !localStorage.getItem('bci_cookies_choice')) {
    setTimeout(() => b.classList.add('visible'), 1500);
  }
}
function acceptCookies() {
  localStorage.setItem('bci_cookies_choice', 'accepted');
  localStorage.setItem('bci_cookies_date', new Date().toISOString());
  const b = document.getElementById('cookieBanner'); if (b) b.classList.remove('visible');
}
function refuseCookies() {
  localStorage.setItem('bci_cookies_choice', 'refused');
  localStorage.setItem('bci_cookies_date', new Date().toISOString());
  const b = document.getElementById('cookieBanner'); if (b) b.classList.remove('visible');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  generateCaptchas();
  showCookieBanner();
});

// V5 - Modal RGPD
function openModal(id) {
  const m = document.getElementById('modal-' + id);
  if (!m) { console.warn('Modale absente : ' + id); return; }
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const m = document.getElementById('modal-' + id);
  if (!m) return;
  m.classList.remove('active');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
});

// V5 - Lead magnet submit (deprecated, replaced by V10 with anti-spam)




// ========== V20 · ROUTEUR D'ANCRE ==========
// Permet un lien profond depuis une autre entité : patrimoine.html#patrim, elec.html#elec-pro.
// Sans lui, les onglets internes ne seraient atteignables que par un clic sur place.
(function () {
  function routerAncre() {
    var h = (location.hash || '').replace('#', '');
    if (!h) return;
    if (document.getElementById('page-' + h)) {
      showPage(h);
      return;
    }
    var el = document.getElementById(h);
    if (el) setTimeout(function () { el.scrollIntoView({ behavior: 'smooth' }); }, 80);
  }
  document.addEventListener('DOMContentLoaded', routerAncre);
  window.addEventListener('hashchange', routerAncre);
})();
