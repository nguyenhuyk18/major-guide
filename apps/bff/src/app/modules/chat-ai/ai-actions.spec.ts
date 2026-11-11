import { safeInternalHref, sanitizeMemberActions } from './ai-actions';

describe('member AI actions', () => {
  it('keeps allow-listed internal links only', () => {
    expect(safeInternalHref('/hold-slot?slot_id=a&expert_id=b&specify_time=2026-11-18')).toBe(
      '/hold-slot?slot_id=a&expert_id=b&specify_time=2026-11-18'
    );
    expect(safeInternalHref('/experts/6acf3167f57f5786c6e86963')).toBe('/experts/6acf3167f57f5786c6e86963');
    for (const bad of [
      'https://evil.example/my-bookings',
      '//evil.example/quiz',
      'javascript:alert(1)',
      '/\\evil.example',
      '/admin/accounting',
      '/my-bookings-evil',
      'quiz',
      42,
    ]) {
      expect(safeInternalHref(bad)).toBeNull();
    }
  });

  it('cleans expert cards and drops unknown action types', () => {
    const actions = sanitizeMemberActions([
      { type: 'link', label: 'Mở Lịch của tôi', href: '/my-bookings' },
      { type: 'link', label: 'Phishing', href: 'https://evil.example' },
      { type: 'email_draft', recipient: 'x@y.z' },
      {
        type: 'experts',
        experts: [
          { id: '6acf3167f57f5786c6e86963', name: 'Kim', email: 'kim@x.vn', price: '200000', avatar: 'javascript:alert(1)' },
          { id: '../../admin', name: 'Bad id' },
        ],
      },
    ]);
    expect(actions).toEqual([
      { type: 'link', label: 'Mở Lịch của tôi', href: '/my-bookings' },
      {
        type: 'experts',
        experts: [
          {
            id: '6acf3167f57f5786c6e86963', name: 'Kim', price: 200000,
            major: undefined, teachAt: undefined, level: undefined, avatar: undefined, matchReason: undefined,
          },
        ],
      },
    ]);
    expect(JSON.stringify(actions)).not.toContain('kim@x.vn');
  });

  it('tolerates junk input', () => {
    expect(sanitizeMemberActions(undefined)).toEqual([]);
    expect(sanitizeMemberActions('x')).toEqual([]);
    expect(sanitizeMemberActions([null, 1, { type: 'link' }])).toEqual([]);
  });
});
