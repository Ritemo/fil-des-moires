"""Enregistre les répliques de l'histoire avec des voix neuronales (edge-tts), une voix par personnage.
Usage : python outils/voix.py repliques.json   -> art/voix/<id>.mp3 et art/voix/index.json
Seules les répliques pas encore enregistrées sont générées."""
import asyncio, json, os, sys
import edge_tts

DOSSIER = os.path.join(os.path.dirname(__file__), '..', 'art', 'voix')
# Voix, débit et hauteur de chaque personnage
VOIX = {
    'narrateur': ('fr-FR-HenriNeural', '-6%', '-2Hz'),
    'clotho':    ('fr-FR-VivienneMultilingualNeural', '-4%', '+0Hz'),
    'phaena':    ('fr-FR-DeniseNeural', '+0%', '+4Hz'),
    'nikias':    ('fr-BE-GerardNeural', '-4%', '-4Hz'),
    'aelis':     ('fr-CH-ArianeNeural', '-12%', '-2Hz'),
    'hermes':    ('fr-FR-RemyMultilingualNeural', '+10%', '+2Hz'),
    'dionysos':  ('fr-CH-FabriceNeural', '+6%', '-2Hz'),
    'artemis':   ('fr-BE-CharlineNeural', '-4%', '+0Hz'),
    'soeurs':    ('fr-CA-SylvieNeural', '-12%', '-25Hz'),
    'lysandre':  ('fr-FR-DeniseNeural', '-14%', '-18Hz'),
}

async def enregistrer(r):
    voix, debit, hauteur = VOIX.get(r['qui'], VOIX['narrateur'])
    chemin = os.path.join(DOSSIER, r['id'] + '.mp3')
    for essai in range(3):
        try:
            await edge_tts.Communicate(r['texte'], voix, rate=debit, pitch=hauteur).save(chemin)
            return True
        except Exception as e:  # réseau capricieux : on réessaie
            print('échec', r['id'], e); await asyncio.sleep(2 + essai * 3)
    return False

async def main():
    repliques = json.load(open(sys.argv[1], encoding='utf-8'))
    os.makedirs(DOSSIER, exist_ok=True)
    faites = 0
    for r in repliques:
        if os.path.exists(os.path.join(DOSSIER, r['id'] + '.mp3')): continue
        if await enregistrer(r): faites += 1
        await asyncio.sleep(0.3)
    ids = sorted(f[:-4] for f in os.listdir(DOSSIER) if f.endswith('.mp3'))
    json.dump(ids, open(os.path.join(DOSSIER, 'index.json'), 'w'))
    print(f'{faites} nouvelles répliques enregistrées, {len(ids)} au total')

asyncio.run(main())
