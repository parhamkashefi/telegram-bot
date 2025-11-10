db.auth('initUser', 'initPass');

db = db.getSiblingDB('PricesDatabase');

db.createUser({
  user: 'hi',
  pwd: 'hi',
  roles: [
    {
      role: 'readWrite',
      db: 'MelkDatabase',
    },
  ],
});
