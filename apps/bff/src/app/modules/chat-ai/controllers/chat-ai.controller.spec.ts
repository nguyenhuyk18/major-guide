import axios from 'axios';
import { HttpException } from '@nestjs/common';
import { ChatAiController } from './chat-ai.controller';
import { ROLE } from '@common/constant/enum/action.constant';

jest.mock('axios');
const post = axios.post as jest.Mock;

const request = { headers: { authorization: 'Bearer user-token' } } as any;
const user = (id: string, roleName: ROLE, name = 'Người dùng') => ({ id, roleName, name } as any);

describe('ChatAiController', () => {
  let controller: ChatAiController;
  const mail = { emit: jest.fn(() => ({ subscribe: jest.fn() })) };

  beforeEach(() => {
    process.env['AGENTIC_INTERNAL_TOKEN'] = 'internal';
    post.mockReset();
    controller = new ChatAiController(mail as any);
  });

  it('forwards member chats with the verified identity, not the request body', async () => {
    post.mockResolvedValue({
      data: {
        type: 'answer',
        message: 'Bạn hợp CNTT',
        actions: [
          { type: 'link', label: 'Xem kết quả', href: '/quiz-history' },
          { type: 'link', label: 'x', href: 'https://evil.example' },
        ],
      },
    });
    const result = await controller.memberChat(
      { message: 'Kết quả test của tôi?', history: [{ role: 'user', content: 'chào' }], user_id: 'someone-else' } as any,
      user('member-1', ROLE.MEMBER, 'An'),
      request
    );
    const [url, body, config] = post.mock.calls[0];
    expect(url).toMatch(/\/chat-ai\/member$/);
    expect(body).toEqual({ message: 'Kết quả test của tôi?', user_id: 'member-1', name: 'An', history: [{ role: 'user', content: 'chào' }] });
    expect(config.headers).toMatchObject({ Authorization: 'Bearer user-token', 'X-Internal-Token': 'internal' });
    expect(result.data).toEqual({
      type: 'answer',
      message: 'Bạn hợp CNTT',
      actions: [{ type: 'link', label: 'Xem kết quả', href: '/quiz-history' }],
    });
  });

  it('rate limits members per account', async () => {
    post.mockResolvedValue({ data: { message: 'ok' } });
    for (let i = 0; i < 12; i++) await controller.memberChat({ message: 'hi' } as any, user('m-2', ROLE.MEMBER), request);
    await expect(controller.memberChat({ message: 'hi' } as any, user('m-2', ROLE.MEMBER), request)).rejects.toMatchObject({ status: 429 });
    await expect(controller.memberChat({ message: 'hi' } as any, user('m-3', ROLE.MEMBER), request)).resolves.toBeDefined();
  });

  it('maps AI outages to a clean error', async () => {
    post.mockRejectedValue({ response: { status: 503, data: { detail: 'Trợ lý AI đang quá tải.' } } });
    await expect(controller.memberChat({ message: 'hi' } as any, user('m-4', ROLE.MEMBER), request)).rejects.toMatchObject({
      status: 503,
      message: 'Trợ lý AI đang quá tải.',
    });
  });

  it('refuses member chat when the internal token is missing', async () => {
    delete process.env['AGENTIC_INTERNAL_TOKEN'];
    await expect(controller.memberChat({ message: 'hi' } as any, user('m-5', ROLE.MEMBER), request)).rejects.toBeInstanceOf(HttpException);
    expect(post).not.toHaveBeenCalled();
  });

  it('sends the expert role and drops admin-only actions for experts', async () => {
    post.mockResolvedValue({
      data: { type: 'action_proposal', message: 'x', actions: [{ type: 'email_draft', requires_confirmation: true, recipient: 'a@b.c' }] },
    });
    const result: any = await controller.sendMessage({ message: 'Mai tôi có lịch nào?' } as any, user('expert-1', ROLE.EXPERT), request);
    expect(post.mock.calls[0][1]).toMatchObject({ role: 'expert', user_id: 'expert-1' });
    expect(result.data.actions).toEqual([]);
  });

  it('keeps confirmable email drafts for admins', async () => {
    post.mockResolvedValue({
      data: { type: 'action_proposal', message: 'x', actions: [{ type: 'email_draft', requires_confirmation: true, recipient: 'a@b.c' }] },
    });
    const result: any = await controller.sendMessage(
      { message: 'Soạn email', history: [{ role: 'assistant', content: 'Chào admin' }] } as any,
      user('admin-1', ROLE.ADMIN),
      request
    );
    expect(post.mock.calls[0][1]).toMatchObject({ role: 'admin', history: [{ role: 'assistant', content: 'Chào admin' }] });
    expect(result.data.actions).toHaveLength(1);
    expect(result.data.actions[0].id).toBeDefined();
  });
});
