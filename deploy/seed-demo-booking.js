// mongosh script: creates (or refreshes) the demo booking used to test video calls.
// The booking is paid, marked is_demo (call room open every day, excluded from revenue)
// and links the member `nguyenhuy` with the expert `kimwexler`.
// Safe to run many times (upsert on id_reverse). Run by deploy.sh, or locally:
//   docker exec -i mongodb_major_guide sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet' < deploy/seed-demo-booking.js
const DEMO = { id: 'demo-video-call', member: 'nguyenhuy', expert: 'kimwexler' };
const users = db.getSiblingDB('useraccess').getCollection('user');
const bookings = db.getSiblingDB('booking').getCollection('reverse');

const member = users.findOne({ username: DEMO.member });
const expert = users.findOne({ username: DEMO.expert });
if (!member || !expert) {
  print(`demo booking skipped: user ${!member ? DEMO.member : DEMO.expert} not found`);
} else {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now); // YYYY-MM-DD
  const at = (h, m) => new Date(`${today}T${h}:${m}:00+07:00`);
  bookings.updateOne(
    { id_reverse: DEMO.id },
    {
      $set: {
        id_member: String(member._id),
        id_expert: String(expert._id),
        name_customer: member.name,
        email_customer: member.email,
        name_expert: expert.name,
        avatar_expert: expert.fileAvartarUrl,
        day_support: today,
        time_start: at('00', '00'),
        time_end: at('23', '59'),
        status: 'paied',
        price_support: 0,
        amount_paid: 0,
        platform_fee: 0,
        note: 'Lịch demo kiểm thử video call - phòng gọi luôn mở, không tính doanh thu.',
        is_demo: true,
        updatedAt: now,
      },
      $setOnInsert: { id_shift_in_day: 'demo', payment_date: now, joinAt: null, createdAt: now },
    },
    { upsert: true }
  );
  print(`demo booking ready: ${DEMO.member} <-> ${DEMO.expert} (id_reverse=${DEMO.id})`);
}
