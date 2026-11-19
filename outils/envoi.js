/* Robot « Envoi » : expédie via ntfy les notifications que le script de sauvegarde n'a pas pu envoyer
   lui-même (ntfy refuse souvent les serveurs partagés de Google). Réveillé par le script (workflow_dispatch).
   Secrets : SAUVEGARDE_URL et SAUVEGARDE_CLE. Les sujets ntfy ne sont jamais écrits dans le journal (dépôt public). */
const url = process.env.SAUVEGARDE_URL, cle = process.env.SAUVEGARDE_CLE;
(async () => {
  if (!url || !cle) { console.log('Secrets SAUVEGARDE_URL et SAUVEGARDE_CLE absents : rien à faire.'); return; }
  const r = await fetch(url + '?cle=' + encodeURIComponent(cle) + '&boite=1');
  const j = await r.json();
  if (!j.ok || !j.messages) throw new Error('Script de sauvegarde : ' + (j.erreur || 'réponse inattendue (le script est-il en version 8 ?)'));
  console.log(j.messages.length + ' message(s) dans la boîte d\'envoi.');
  let echecs = 0;
  for (const m of j.messages) {
    let code = 0;
    for (let essai = 0; essai < 3 && code !== 200; essai++) {
      if (essai) await new Promise(ok => setTimeout(ok, 5000));
      code = (await fetch('https://ntfy.sh/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) })).status;
    }
    console.log('« ' + m.title + ' » -> ' + code);
    if (code !== 200) echecs++;
  }
  if (echecs) process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
