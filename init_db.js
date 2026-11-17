
const connection = require('./database');

// 1. Table des catégories
const categoriesSQL = `
  CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

// 2. Table des produits
const produitsSQL = `
  CREATE TABLE IF NOT EXISTS produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    prix DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    categorie_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categorie_id)
      REFERENCES categories(id)
      ON DELETE SET NULL
  )
`;

// 3. Table des commandes
const commandesSQL = `
  CREATE TABLE IF NOT EXISTS commandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_client VARCHAR(150) NOT NULL,
    telephone VARCHAR(30) NOT NULL,
    adresse_livraison TEXT NOT NULL,
    mode_paiement VARCHAR(50) NOT NULL,
    montant_total DECIMAL(10, 2) NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'En attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

// 4. Table des articles de chaque commande
const detailsCommandeSQL = `
  CREATE TABLE IF NOT EXISTS details_commande (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    produit_id INT NOT NULL,
    nom_produit VARCHAR(150) NOT NULL,
    quantite INT NOT NULL,
    prix_unitaire DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (commande_id)
      REFERENCES commandes(id)
      ON DELETE CASCADE,
    FOREIGN KEY (produit_id)
      REFERENCES produits(id)
  )
`;

// Création des tables dans l'ordre nécessaire
connection.query(categoriesSQL, (erreur) => {
  if (erreur) return terminerAvecErreur('catégories', erreur);

  console.log('Table categories créée avec succès.');

  connection.query(produitsSQL, (erreurProduit) => {
    if (erreurProduit) return terminerAvecErreur('produits', erreurProduit);

    console.log('Table produits créée avec succès.');

    connection.query(commandesSQL, (erreurCommande) => {
      if (erreurCommande) {
        return terminerAvecErreur('commandes', erreurCommande);
      }

      console.log('Table commandes créée avec succès.');

      connection.query(detailsCommandeSQL, (erreurDetails) => {
        if (erreurDetails) {
          return terminerAvecErreur('details_commande', erreurDetails);
        }

        console.log('Table details_commande créée avec succès.');
        connection.end();
      });
    });
  });
});

function terminerAvecErreur(table, erreur) {
  console.error(`Erreur lors de la création de ${table} :`, erreur.message);
  connection.end();
}
