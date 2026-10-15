/* eslint-disable @typescript-eslint/no-explicit-any -- jest mocks */
import PushSubscription from 'src/database/models/push-subscriptions.model';
import { FcmChannel } from './fcm.channel';
import { Delivery } from './notification-channel';

const sendEachForMulticast = jest.fn();
jest.mock('firebase-admin', () => ({
  apps: [] as unknown[],
  initializeApp: jest.fn(() => ({ messaging: () => ({ sendEachForMulticast }) })),
  credential: { cert: jest.fn((json) => ({ json })) },
}));
jest.mock('/tmp/sn-fake-fcm-credentials.json', () => ({ project_id: 'sn-test' }), { virtual: true });

/**
 * FCM adapter against a mocked firebase-admin (real delivery needs a Firebase project + service account):
 * message shape (FCM data values must be strings) and pruning of tokens FCM reports as unregistered.
 */
describe('FcmChannel', () => {
  const delivery: Delivery = {
    userId: 7,
    email: null,
    phone: null,
    notificationId: 'n1',
    templateKey: 'shift_offered',
    title: 'Có ca làm mới phù hợp',
    body: 'Phục vụ bàn',
    url: '/sn/worker/shifts/abc',
    data: { shift_id: 'abc' },
  };

  beforeEach(() => {
    process.env.FCM_CREDENTIALS_PATH = '/tmp/sn-fake-fcm-credentials.json';
    sendEachForMulticast.mockReset();
  });

  afterAll(() => {
    delete process.env.FCM_CREDENTIALS_PATH;
  });

  it('is disabled without FCM_CREDENTIALS_PATH', () => {
    delete process.env.FCM_CREDENTIALS_PATH;
    expect(new FcmChannel().enabled()).toBe(false);
  });

  it('sends one multicast with string data and prunes unregistered tokens', async () => {
    const gone = { endpoint: 'token-gone', destroy: jest.fn() };
    const live = { endpoint: 'token-live', destroy: jest.fn() };
    jest.spyOn(PushSubscription, 'findAll').mockResolvedValue([live, gone] as any);
    sendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      responses: [{ success: true }, { success: false, error: { code: 'messaging/registration-token-not-registered' } }],
    });

    const channel = new FcmChannel();
    expect(channel.enabled()).toBe(true);
    await expect(channel.send(delivery)).resolves.toBe(true);

    const message = sendEachForMulticast.mock.calls[0][0];
    expect(message.tokens).toEqual(['token-live', 'token-gone']);
    expect(message.notification).toEqual({ title: delivery.title, body: delivery.body });
    expect(Object.values(message.data).every((v) => typeof v === 'string')).toBe(true);
    expect(gone.destroy).toHaveBeenCalled();
    expect(live.destroy).not.toHaveBeenCalled();
  });

  it('skips users without FCM tokens', async () => {
    jest.spyOn(PushSubscription, 'findAll').mockResolvedValue([]);
    await expect(new FcmChannel().send(delivery)).resolves.toBe(false);
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });
});
