"""Télécharge les décors (peintures du domaine public, Wikimedia Commons) et les prépare pour le jeu.
Lancé par le robot « Décors » (.github/workflows/decors.yml), qui a accès à Internet."""
import io, os, urllib.parse, urllib.request
from PIL import Image, ImageEnhance

DECORS = {
    'foret':  'Iwan Iwanowitsch Schischkin 001.jpg',                                   # Chichkine, Ruisseau dans une forêt de bouleaux (1883)
    'ruines': 'Caspar David Friedrich - Abtei im Eichwald - Google Art Project.jpg',   # Friedrich, L'Abbaye dans une forêt de chênes (1809-1810)
    'fils':   'Caspar David Friedrich 032 (The wanderer above the sea of fog).jpg',     # Friedrich, Le Voyageur contemplant une mer de nuages (vers 1818)
    'etang':  'Arnold Böcklin - Die Toteninsel II (Metropolitan Museum of Art).jpg',    # Böcklin, L'Île des morts (1880)
    'agora':  'Akropolis by Leo von Klenze.jpg',                                        # von Klenze, L'Acropole d'Athènes (1846)
}
# Chant II : on cherche l'œuvre sur Commons (premier résultat image), pour ne pas dépendre du nom exact du fichier
RECHERCHES = {
    'cendres': 'Joseph Wright of Derby Vesuvius in eruption',     # Wright of Derby, le Vésuve en éruption (vers 1776)
    'forge':   'Velázquez Forge of Vulcan',                       # Velázquez, La Forge de Vulcain (1630)
    'lave':    'John Martin Destruction of Pompeii and Herculaneum',  # John Martin (1822)
    'tartare': 'John Martin Pandemonium',                         # John Martin, Pandémonium (1841)
}
UA = {'User-Agent': 'FilDesMoires/1.0 (jeu personnel ; https://github.com/Ritemo/fil-des-moires)'}
import json
def chercher(q):
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'list': 'search', 'srnamespace': 6, 'srlimit': 5, 'format': 'json', 'srsearch': q + ' filetype:bitmap'})
    r = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())
    res = [x['title'][5:] for x in r['query']['search'] if x['title'].lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not res: raise Exception('rien trouvé pour ' + q)
    print('  ', q, '->', res[0]); return res[0]
for nom, q in RECHERCHES.items():
    if os.path.exists('art/decor/%s.jpg' % nom): continue
    try: DECORS[nom] = chercher(q)
    except Exception as e: print('décor', nom, 'introuvable :', e)
os.makedirs('art/decor', exist_ok=True)
for nom, fichier in DECORS.items():
  try:
    url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(fichier) + '?width=1200'
    req = urllib.request.Request(url, headers={'User-Agent': 'FilDesMoires/1.0 (jeu personnel ; https://github.com/Ritemo/fil-des-moires)'})
    data = urllib.request.urlopen(req, timeout=60).read()
    im = Image.open(io.BytesIO(data)).convert('RGB')
    im.thumbnail((900, 900))
    im = ImageEnhance.Color(im).enhance(0.9)
    im.save('art/decor/%s.jpg' % nom, quality=72, optimize=True, progressive=True)
    print(nom, im.size, os.path.getsize('art/decor/%s.jpg' % nom) // 1024, 'Ko')
  except Exception as e:
    print('décor', nom, 'en échec :', e)
