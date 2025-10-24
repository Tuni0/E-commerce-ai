import {useState} from 'react';
import {useCheckout} from '@stripe/react-stripe-js';

import './PayButton.css'

const PayButton = () => {
  const {confirm} = useCheckout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = () => {
    setLoading(true);
    confirm({email: 'test@yopmail.com'}).then((result) => { // random test email
        console.log(result);
        
      if (result.type === 'error') {
        setError(result.error)
      }
      setLoading(false);
    })
  };

  return (
    <div className='PayButton'>
      <button claa disabled={loading} onClick={handleClick}>
        Pay
      </button>
      {error && <div>{error.message}</div>}
    </div>
  )
};

export default PayButton;