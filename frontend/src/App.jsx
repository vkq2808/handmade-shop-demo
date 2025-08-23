
import React from 'react';

import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { CartContext } from './contexts/cart.context.jsx';
function App() {
  const { fetchCart } = React.useContext(CartContext);

  React.useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
