const connection = require('./database');

// Produits de démonstration de la boutique
// MÊMES PRIX que catalogue_donnees.dart - ne plus modifier un seul côté
const produits = [
  {
    nom: 'Robe élégante',
    description: 'Robe élégante pour les sorties et les cérémonies.',
    prix: 25000,
    stock: 10,
    image_url: 'assets/images/robe_elegante.jpg',
    categorie_id: 1,
  },
  {
    nom: 'Ensemble tendance',
    description: 'Un ensemble moderne et confortable.',
    prix: 30000,
    stock: 10,
    image_url: 'assets/images/ensemble_tendance.jpg',
    categorie_id: 1,
  },
  {
    nom: 'Babouches en cuir',
    description: 'Des babouches élégantes pour le quotidien.',
    prix: 15000,
    stock: 20,
    image_url: 'assets/images/babouches_cuir.jpg',
    categorie_id: 2,
  },
  {
    nom: 'Babouches classiques',
    description: 'Babouches confortables pour un usage quotidien.',
    prix: 12000,
    stock: 20,
    image_url: 'assets/images/babouches_classiques.jpg',
    categorie_id: 2,
  },
  {
    nom: 'Perruque naturelle',
    description: 'Perruque naturelle pour un style élégant.',
    prix: 45000,
    stock: 8,
    image_url: 'assets/images/perruque_naturelle.jpg',
    categorie_id: 3,
  },
  {
    nom: 'Perruque bouclée',
    description: 'Un style bouclé pour changer de look.',
    prix: 50000,
    stock: 8,
    image_url: 'assets/images/perruque_bouclee.jpg',
    categorie_id: 3,
  },
];

connection.serialize(() => {
  connection.run('DELETE FROM produits');
  const stmt = connection.prepare('INSERT INTO produits (nom, description, prix, stock, image_url, categorie_id) VALUES (?, ?, ?, ?, ?, ?)');
  produits.forEach((p) => {
    stmt.run(p.nom, p.description, p.prix, p.stock, p.image_url, p.categorie_id);
  });
  stmt.finalize(() => {
    console.log('Produits mis à jour : 6 produits, prix alignés avec catalogue_donnees.dart');
    connection.close();
  });
});