import {PaymentElement} from '@stripe/react-stripe-js';
import PayButton from './PayButton';

const CheckoutForm = () => {
  return (
    <form>
      <PaymentElement />
      <PayButton/>
    </form>
  );
};

export default CheckoutForm;