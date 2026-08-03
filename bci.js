
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
  const ph = document.getElementById('page-home');
  if (ph && !ph.classList.contains('active')) {
    showPage('home');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
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
function submitForm(form) {
  if (!validateAntiSpam(form, 'contact')) return;
  alert('OK - Demande envoyée avec succès. Jean François Bartier vous recontactera sous 24h ouvrées.\n\n(Mockup - dans la version finale, ce formulaire enverra un email via votre intégration backend Brevo / Mailgun / SendGrid.)');
  form.reset();
  generateCaptchas();
}

// ============================================================
// CONFIGURATION BREVO — À RENSEIGNER APRÈS CRÉATION DU FORMULAIRE
// ============================================================
// 1. Créer un compte sur brevo.com (gratuit)
// 2. Créer une liste "Inscrits guide BCI"
// 3. Créer un formulaire Brevo (Marketing > Formulaires)
// 4. Récupérer l'URL d'action du formulaire (commence par https://xxx.sibforms.com/serve/...)
// 5. Remplacer la valeur ci-dessous par cette URL :
const BREVO_FORM_URL = 'À_REMPLACER_PAR_URL_BREVO';  // ⚠️ À CONFIGURER
// ============================================================

function submitLead(form) {
  if (!validateAntiSpam(form, 'lead')) return;

  // Si Brevo n'est pas encore configuré, on tombe en mode mockup
  if (BREVO_FORM_URL === 'À_REMPLACER_PAR_URL_BREVO') {
    alert('OK - Demande enregistrée (MODE TEST).\n\nLe formulaire n\'est pas encore branché sur Brevo. Voir BCI_Branchement_Brevo.md pour la procédure.');
    form.reset();
    generateCaptchas();
    return;
  }

  // Mode production : POST vers Brevo
  const email = form.querySelector('[name="email"]').value;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = 'Envoi en cours...';
  submitBtn.disabled = true;

  const formData = new FormData();
  formData.append('EMAIL', email);
  formData.append('OPT_IN', '1');
  formData.append('email_address_check', '');  // Honeypot Brevo
  formData.append('locale', 'fr');

  fetch(BREVO_FORM_URL, {
    method: 'POST',
    body: formData,
    mode: 'no-cors'  // Brevo retourne du HTML, on ignore la réponse côté client
  })
  .then(() => {
    alert('Merci. Vous allez recevoir le guide PDF par courriel dans quelques minutes.\n\nSi vous ne le voyez pas, vérifiez votre dossier indésirable.');
    form.reset();
    generateCaptchas();
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  })
  .catch(err => {
    console.error('Erreur Brevo:', err);
    alert('Désolé, une erreur est survenue. Merci de réessayer ou de nous écrire directement à contact@bcorpinternational.com.');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  });
}

// V10 - Book interest form
function openBookForm(livre) {
  const titles = {
    'manifeste': 'Pré-commander le Manifeste',
    'indice-omega': 'Alerte parution · L\'indice Ω',
    'cas-pratiques': 'S\'inscrire · 20 cas pratiques'
  };
  const subtitles = {
    'manifeste': 'Réservez votre exemplaire du manifeste fondateur de la Patrimétrologie. Parution automne 2026. Envoi prioritaire aux pré-commandes.',
    'indice-omega': 'Soyez alerté dès la parution du cahier technique de l\'indice Ω (édition 2027). Tirage limité, réservé aux praticiens.',
    'cas-pratiques': 'Inscrivez-vous pour recevoir un extrait gratuit et être prévenu de la parution du recueil de 20 cas pratiques (édition 2027).'
  };
  document.getElementById('bookModalTitle').textContent = titles[livre] || 'Réserver mon exemplaire';
  document.getElementById('bookModalSubtitle').textContent = subtitles[livre] || '';
  document.getElementById('bookFormLivre').value = livre;
  openModal('book');
}

function submitBookForm(form) {
  if (!validateAntiSpam(form, 'book')) return;
  alert('OK - Votre intérêt est bien enregistré. Vous serez recontacté dès la parution.\n\n(Mockup - en production, intégration avec votre outil CRM / mailing.)');
  closeModal('book');
  form.reset();
  generateCaptchas();
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
