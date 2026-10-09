import { Provider } from '@nestjs/common';
import PaymentIntent from 'src/database/models/payment-intents.model';
import { PAYMENT_GATEWAY } from './application/ports/payment-gateway.port';
import { FakePaymentGateway } from './infrastructure/fake-payment-gateway';
import { snConfig } from 'src/shared/sn-runtime';

export const walletProvider: Provider[] = [
  { provide: 'PAYMENT_INTENT_REPOSITORY', useValue: PaymentIntent },
  FakePaymentGateway,
  {
    provide: PAYMENT_GATEWAY,
    inject: [FakePaymentGateway],
    useFactory: (fake: FakePaymentGateway) => {
      const name = snConfig().PAYMENT_GATEWAY;
      if (name !== 'fake') throw new Error(`PAYMENT_GATEWAY=${name} has no adapter yet (only 'fake' in v1)`);
      return fake;
    },
  },
];
