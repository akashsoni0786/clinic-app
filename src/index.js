import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { HashRouter } from "react-router-dom";
import { Context } from './Context/appcontext';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AppProvider>
    <Context>
      <HashRouter>
        <App />
      </HashRouter>
    </Context>
  </AppProvider>
);
