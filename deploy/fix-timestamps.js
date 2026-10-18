// mongosh script: repairs createdAt/updatedAt written with the service start-up time
// (old bug: `default: new Date()` in base.schema.ts). The real creation time is kept in
// every ObjectId, so createdAt is restored from _id when they differ by more than 1 minute.
// updatedAt is repaired only when it still holds the same stale value.
// Also refreshes chat rooms' last_message.createdAt. Safe to run many times.
const DBS = ['useraccess', 'booking', 'timeslot', 'chat', 'media', 'aiagent'];
const TOLERANCE_MS = 60 * 1000;
let fixed = 0;

for (const dbName of DBS) {
  const database = db.getSiblingDB(dbName);
  for (const name of database.getCollectionNames()) {
    if (name.startsWith('system.')) continue;
    const collection = database.getCollection(name);
    const ops = [];
    collection.find({ createdAt: { $type: 'date' } }, { createdAt: 1, updatedAt: 1 }).forEach((doc) => {
      if (!(doc._id instanceof ObjectId)) return;
      const real = doc._id.getTimestamp();
      if (Math.abs(doc.createdAt - real) <= TOLERANCE_MS) return;
      const set = { createdAt: real };
      if (doc.updatedAt instanceof Date && Math.abs(doc.updatedAt - doc.createdAt) <= 1000) set.updatedAt = real;
      ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });
    });
    if (ops.length) {
      collection.bulkWrite(ops, { ordered: false });
      print(`${dbName}.${name}: ${ops.length} fixed`);
      fixed += ops.length;
    }
  }
}

// Chat rooms copy the last message; take its time from the message itself.
const chat = db.getSiblingDB('chat');
const messages = chat.getCollection('private-message');
chat.getCollection('room-chat').find({ 'last_message.id': { $exists: true } }).forEach((room) => {
  let id;
  try { id = new ObjectId(String(room.last_message.id)); } catch (e) { return; }
  const message = messages.findOne({ _id: id }, { createdAt: 1 });
  if (message && +message.createdAt !== +room.last_message.createdAt) {
    chat.getCollection('room-chat').updateOne({ _id: room._id }, { $set: { 'last_message.createdAt': message.createdAt, updatedAt: message.createdAt } });
    fixed++;
  }
});
print(`timestamps repaired: ${fixed}`);
