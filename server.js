const express = require('express');
const cors = require('cors');
const connection = require('./database');

const app = express();
// CORRIGÉ pour la mise en ligne : Railway donne son propre PORT
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =====================================
// 1. ROUTE D'ACCUEIL
// =====================================
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue dans le backend de Boutique Mobile !',
    statut: 'Serveur fonctionnel',
  });
});

// =====================================
// 2. ROUTE DE TEST
// =====================================
app.get('/api/test', (req, res) => {
  res.json({
    succes: true,
    message: 'La connexion à l’API fonctionne.',
  });
});

// =====================================
// 3. RÉCUPÉRER LES CATÉGORIES
// =====================================
app.get('/api/categories', (req, res) => {
  const sql = 'SELECT * FROM categories ORDER BY id ASC';

  connection.query(sql, (erreur, resultats) => {
    if (erreur) {
      console.error('Erreur catégories :', erreur.message);

      return res.status(500).json({
        succes: false,
        message: 'Impossible de récupérer les catégories.',
      });
    }

    res.json({
      succes: true,
      nombre: resultats.length,
      categories: resultats,
    });
  });
});

// =====================================
// 4. RÉCUPÉRER LES PRODUITS
// =====================================
app.get('/api/produits', (req, res) => {
  const sql = `
    SELECT
      produits.id,
      produits.nom,
      produits.description,
      produits.prix,
      produits.stock,
      produits.image_url,
      produits.categorie_id,
      categories.nom AS categorie
    FROM produits
    LEFT JOIN categories
      ON produits.categorie_id = categories.id
    ORDER BY produits.id ASC
  `;

  connection.query(sql, (erreur, resultats) => {
    if (erreur) {
      console.error('Erreur produits :', erreur.message);

      return res.status(500).json({
        succes: false,
        message: 'Impossible de récupérer les produits.',
      });
    }

    res.json({
      succes: true,
      nombre: resultats.length,
      produits: resultats,
    });
  });
});

// =====================================
// 4-BIS. CRUD PRODUITS - ADMIN - NOUVEAU
// Ajouter / Modifier / Supprimer
// =====================================

// AJOUTER un produit
app.post('/api/produits', (req, res) => {
  const { nom, description, prix, stock, image_url, categorie_id } = req.body;
  if (!nom || prix == null || stock == null) {
    return res.status(400).json({ succes: false, message: 'Nom, prix et stock obligatoires.' });
  }
  connection.query(
    'INSERT INTO produits (nom, description, prix, stock, image_url, categorie_id) VALUES (?, ?, ?, ?, ?, ?)',
    [nom, description || '', Number(prix), Number(stock), image_url || '', categorie_id || null],
    (erreur, resultat) => {
      if (erreur) {
        console.error('Erreur ajout produit :', erreur.message);
        return res.status(500).json({ succes: false, message: erreur.message });
      }
      res.status(201).json({ succes: true, message: 'Produit ajouté.', id: resultat.insertId });
    }
  );
});

// MODIFIER un produit
app.put('/api/produits/:id', (req, res) => {
  const { id } = req.params;
  const { nom, description, prix, stock, image_url, categorie_id } = req.body;
  connection.query(
    'UPDATE produits SET nom=?, description=?, prix=?, stock=?, image_url=?, categorie_id=? WHERE id=?',
    [nom, description || '', Number(prix), Number(stock), image_url || '', categorie_id || null, id],
    (erreur, resultat) => {
      if (erreur) {
        console.error('Erreur modif produit :', erreur.message);
        return res.status(500).json({ succes: false, message: erreur.message });
      }
      if (resultat.affectedRows === 0) {
        return res.status(404).json({ succes: false, message: 'Produit introuvable.' });
      }
      res.json({ succes: true, message: 'Produit modifié.' });
    }
  );
});

// SUPPRIMER un produit
app.delete('/api/produits/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM produits WHERE id = ?', [id], (erreur, resultat) => {
    if (erreur) {
      console.error('Erreur suppression produit :', erreur.message);
      return res.status(500).json({ succes: false, message: erreur.message });
    }
    if (resultat.affectedRows === 0) {
      return res.status(404).json({ succes: false, message: 'Produit introuvable.' });
    }
    res.json({ succes: true, message: 'Produit supprimé.' });
  });
});

// =====================================
// 5. ENREGISTRER UNE COMMANDE
// =====================================
app.post('/api/commandes', (req, res) => {
  const {
    nom_client,
    telephone,
    adresse_livraison,
    mode_paiement,
    articles,
  } = req.body;

  if (
    !nom_client ||
    !telephone ||
    !adresse_livraison ||
    !mode_paiement ||
    !Array.isArray(articles) ||
    articles.length === 0
  ) {
    return res.status(400).json({
      succes: false,
      message: 'Veuillez remplir toutes les informations de la commande.',
    });
  }

  const modesAutorises = [
    'Paiement à la livraison',
    'MTN Mobile Money',
    'Orange Money',
    'Carte bancaire',
  ];

  if (!modesAutorises.includes(mode_paiement)) {
    return res.status(400).json({
      succes: false,
      message: 'Le mode de paiement est invalide.',
    });
  }

  const produitsValides = articles.every((article) =>
    Number.isInteger(Number(article.produit_id)) &&
    Number(article.produit_id) > 0 &&
    Number.isInteger(Number(article.quantite)) &&
    Number(article.quantite) > 0
  );

  if (!produitsValides) {
    return res.status(400).json({
      succes: false,
      message: 'Un produit ou une quantité est invalide.',
    });
  }

  connection.beginTransaction((erreurTransaction) => {
    if (erreurTransaction) {
      console.error('Erreur transaction :', erreurTransaction.message);

      return res.status(500).json({
        succes: false,
        message: 'Impossible de démarrer la commande.',
      });
    }

    const ids = [...new Set(articles.map((a) => Number(a.produit_id)))];

    const placeholders = ids.map(() => '?').join(',');

    const sqlProduits = `
      SELECT id, nom, prix, stock
      FROM produits
      WHERE id IN (${placeholders})
      FOR UPDATE
    `;

    connection.query(sqlProduits, ids, (erreurProduits, produits) => {
      if (erreurProduits) {
        return annulerCommande(
          erreurProduits,
          'Impossible de vérifier les produits.'
        );
      }

      const produitsParId = new Map(
        produits.map((produit) => [Number(produit.id), produit])
      );

      let montantTotal = 0;
      const details = [];

      for (const article of articles) {
        const produit = produitsParId.get(Number(article.produit_id));
        const quantite = Number(article.quantite);

        if (!produit) {
          return annulerCommande(
            new Error('Produit introuvable.'),
            'Un produit de votre panier est introuvable.'
          );
        }

        if (Number(produit.stock) < quantite) {
          return annulerCommande(
            new Error('Stock insuffisant.'),
            `Stock insuffisant pour ${produit.nom}.`
          );
        }

        const prix = Number(produit.prix);
        montantTotal += prix * quantite;

        details.push({
          produit_id: Number(produit.id),
          nom_produit: produit.nom,
          quantite,
          prix_unitaire: prix,
        });
      }

      const sqlCommande = `
        INSERT INTO commandes
          (nom_client, telephone, adresse_livraison,
           mode_paiement, montant_total, statut)
        VALUES (?, ?, ?, ?, ?, 'En attente')
      `;

      connection.query(
        sqlCommande,
        [
          nom_client.trim(),
          telephone.trim(),
          adresse_livraison.trim(),
          mode_paiement,
          montantTotal,
        ],
        (erreurInsertion, resultatCommande) => {
          if (erreurInsertion) {
            return annulerCommande(
              erreurInsertion,
              'Impossible d’enregistrer la commande.'
            );
          }

          const commandeId = resultatCommande.insertId;

          const sqlDetail = `
            INSERT INTO details_commande
              (commande_id, produit_id, nom_produit,
               quantite, prix_unitaire)
            VALUES ?
          `;

          const valeursDetails = details.map((detail) => [
            commandeId,
            detail.produit_id,
            detail.nom_produit,
            detail.quantite,
            detail.prix_unitaire,
          ]);

          connection.query(
            sqlDetail,
            [valeursDetails],
            (erreurDetails) => {
              if (erreurDetails) {
                return annulerCommande(
                  erreurDetails,
                  'Impossible d’enregistrer les articles commandés.'
                );
              }

              const sqlStock = `
                UPDATE produits
                SET stock = stock - ?
                WHERE id = ?
              `;

              let index = 0;

              function diminuerStockSuivant() {
                if (index >= details.length) {
                  return connection.commit((erreurCommit) => {
                    if (erreurCommit) {
                      return annulerCommande(
                        erreurCommit,
                        'Impossible de finaliser la commande.'
                      );
                    }

                    res.status(201).json({
                      succes: true,
                      message: 'Commande enregistrée avec succès.',
                      commande_id: commandeId,
                      montant_total: montantTotal,
                      statut: 'En attente',
                    });
                  });
                }

                const detail = details[index++];

                connection.query(
                  sqlStock,
                  [detail.quantite, detail.produit_id],
                  (erreurStock) => {
                    if (erreurStock) {
                      return annulerCommande(
                        erreurStock,
                        'Impossible de mettre à jour le stock.'
                      );
                    }

                    diminuerStockSuivant();
                  }
                );
              }

              diminuerStockSuivant();
            }
          );
        }
      );
    });

    function annulerCommande(erreur, message) {
      console.error('Erreur commande :', erreur.message);

      connection.rollback(() => {
        res.status(500).json({
          succes: false,
          message,
        });
      });
    }
  });
});

// =====================================
// 5-BIS. LISTER LES COMMANDES - CORRIGÉ
// =====================================
app.get('/api/commandes', (req, res) => {
  connection.query('SELECT * FROM commandes', (erreur, commandes) => {
    if (erreur) {
      console.error('Erreur liste commandes :', erreur.message);
      return res.status(500).json({
        succes: false,
        message: 'Impossible de récupérer les commandes : ' + erreur.message,
      });
    }

    if (!commandes || commandes.length === 0) {
      return res.json({ succes: true, nombre: 0, commandes: [] });
    }

    commandes.sort((a, b) => Number(b.id) - Number(a.id));

    const ids = commandes.map((c) => c.id);
    const placeholders = ids.map(() => '?').join(',');

    const sqlDetails = `
      SELECT commande_id, produit_id, nom_produit, quantite, prix_unitaire
      FROM details_commande
      WHERE commande_id IN (${placeholders})
    `;

    connection.query(sqlDetails, ids, (erreurDetails, details) => {
      if (erreurDetails) {
        console.error('Erreur détails :', erreurDetails.message);
        const sansDetails = commandes.map((c) => ({ ...c, articles: [] }));
        return res.json({ succes: true, nombre: sansDetails.length, commandes: sansDetails });
      }

      const detailsParCommande = {};
      for (const d of details) {
        if (!detailsParCommande[d.commande_id]) {
          detailsParCommande[d.commande_id] = [];
        }
        detailsParCommande[d.commande_id].push({
          produit_id: d.produit_id,
          nom: d.nom_produit,
          nom_produit: d.nom_produit,
          quantite: d.quantite,
          prix_unitaire: d.prix_unitaire,
          prix: d.prix_unitaire,
        });
      }

      const commandesAvecArticles = commandes.map((c) => ({
        ...c,
        articles: detailsParCommande[c.id] || [],
      }));

      res.json({
        succes: true,
        nombre: commandesAvecArticles.length,
        commandes: commandesAvecArticles,
      });
    });
  });
});

// =====================================
// 5-TER. CHANGER LE STATUT
// Pour le bouton "Marquer Livrée"
// =====================================
app.put('/api/commandes/:id/statut', (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  const statutsAutorises = ['En attente', 'Livrée', 'Annulée'];
  if (!statutsAutorises.includes(statut)) {
    return res.status(400).json({ succes: false, message: 'Statut invalide.' });
  }

  connection.query(
    'UPDATE commandes SET statut = ? WHERE id = ?',
    [statut, id],
    (erreur, resultat) => {
      if (erreur) {
        console.error('Erreur statut :', erreur.message);
        return res.status(500).json({ succes: false, message: 'Impossible de changer le statut.' });
      }
      if (resultat.affectedRows === 0) {
        return res.status(404).json({ succes: false, message: 'Commande introuvable.' });
      }
      res.json({ succes: true, message: 'Statut mis à jour.', statut });
    }
  );
});

// =====================================
// 6. DÉMARRER LE SERVEUR
// =====================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
});