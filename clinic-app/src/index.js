import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { BrowserRouter } from "react-router-dom";
import { Context } from './Context/appcontext';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AppProvider 
  // i18n={enTranslations}
  >
    <Context>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Context>
  </AppProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
