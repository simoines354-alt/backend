
const connection = require('./database');

const categories = [
  ['Vêtements', 'Vêtements pour tous les styles'],
  ['Babouches', 'Babouches et chaussures'],
  ['Perruques', 'Perruques et accessoires de beauté'],
];

const sql = `
  INSERT INTO categories (nom, description)
  VALUES (?, ?)
  ON DUPLICATE KEY UPDATE description = VALUES(description)
`;

let index = 0;

function ajouterCategorie() {
  if (index >= categories.length) {
    console.log('Les trois catégories sont prêtes !');
    connection.end();
    return;
  }

  connection.query(sql, categories[index], (erreur) => {
    if (erreur) {
      console.error('Erreur :', erreur.message);
      connection.end();
      return;
    }

    console.log(`Catégorie ajoutée : ${categories[index][0]}`);
    index++;
    ajouterCategorie();
  });
}

ajouterCategorie();
