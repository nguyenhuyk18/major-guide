import { idsMissingNames, withNames } from './ai-overview';

const rows = [
  { bookingId: 'b1', memberId: 'm1', expertId: 'e1', memberName: null, memberEmail: null, expertName: null },
  { bookingId: 'b2', memberId: 'm2', expertId: 'e2', memberName: 'Có sẵn', memberEmail: 'co@san.vn', expertName: 'Kim' },
];
const users = {
  m1: { name: 'Nguyễn Huy', email: 'huy@example.com' },
  e1: { name: 'Jimmy McGill', email: 'jimmy@example.com' },
};

describe('AI booking overview enrichment', () => {
  it('only looks up users whose names are missing, and never members for a member', () => {
    expect(idsMissingNames(rows, 'admin').sort()).toEqual(['e1', 'm1']);
    expect(idsMissingNames(rows, 'member')).toEqual(['e1']);
  });

  it('fills names from user records and strips internal ids', () => {
    const [first, second] = withNames(rows, users, 'admin');
    expect(first).toMatchObject({ memberName: 'Nguyễn Huy', memberEmail: 'huy@example.com', expertName: 'Jimmy McGill' });
    expect(second).toMatchObject({ memberName: 'Có sẵn', memberEmail: 'co@san.vn', expertName: 'Kim' });
    expect(first).not.toHaveProperty('memberId');
    expect(first).not.toHaveProperty('expertId');
  });

  it('gives experts member names but no emails, and members neither', () => {
    const [expertRow] = withNames(rows, users, 'expert');
    expect(expertRow.memberName).toBe('Nguyễn Huy');
    expect(expertRow).not.toHaveProperty('memberEmail');
    const [memberRow] = withNames([{ bookingId: 'b', memberId: 'm1', expertId: 'e1', expertName: null }], users, 'member');
    expect(memberRow).toEqual({ bookingId: 'b', expertName: 'Jimmy McGill' });
  });

  it('tolerates a failed user lookup', () => {
    const [row] = withNames(rows, {}, 'admin');
    expect(row).toMatchObject({ memberName: null, expertName: null });
  });
});
