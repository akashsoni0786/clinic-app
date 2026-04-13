import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { HashRouter } from "react-router-dom";
import { Context } from './Context/appcontext';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Context>
    <HashRouter>
      <App />
    </HashRouter>
  </Context>
);
