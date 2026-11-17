const mysql = require('mysql2');

let connection;

// PRIORITÉ 1 : Railway donne une URL complète (MYSQL_URL ou DATABASE_URL)
// PRIORITÉ 2 : Variables séparées (DB_HOST, DB_USER...)
// PRIORITÉ 3 : Localhost (ton PC, pour tester en local)
const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;

if (dbUrl) {
  console.log('Connexion via URL Railway...');
  connection = mysql.createConnection(dbUrl);
} else {
  connection = mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'boutique_mobile',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  });
}

connection.connect((erreur) => {
  if (erreur) {
    console.error('Erreur de connexion à MySQL :', erreur.message);
    return;
  }
  console.log('Connexion à la base de données réussie !');
});

module.exports = connection;