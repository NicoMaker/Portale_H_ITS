const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

db.get("PRAGMA table_info(schedules)", (err, row) => {
  if (err) throw err;
  db.all("PRAGMA table_info(schedules)", (err, columns) => {
    if (err) throw err;
    const hasSubject = columns.some(col => col.name === 'subject');
    if (!hasSubject) {
      db.run('ALTER TABLE schedules ADD COLUMN subject TEXT NOT NULL DEFAULT ""', (err) => {
        if (err) throw err;
        console.log('Colonna subject aggiunta con successo!');
        db.close();
      });
    } else {
      console.log('La colonna subject esiste già.');
      db.close();
    }
  });
}); 