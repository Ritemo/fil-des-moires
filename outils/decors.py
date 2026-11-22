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
os.makedirs('art/decor', exist_ok=True)
for nom, fichier in DECORS.items():
    url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(fichier) + '?width=1200'
    req = urllib.request.Request(url, headers={'User-Agent': 'FilDesMoires/1.0 (jeu personnel ; https://github.com/Ritemo/fil-des-moires)'})
    data = urllib.request.urlopen(req, timeout=60).read()
    im = Image.open(io.BytesIO(data)).convert('RGB')
    im.thumbnail((900, 900))
    im = ImageEnhance.Color(im).enhance(0.9)
    im.save('art/decor/%s.jpg' % nom, quality=72, optimize=True, progressive=True)
    print(nom, im.size, os.path.getsize('art/decor/%s.jpg' % nom) // 1024, 'Ko')
