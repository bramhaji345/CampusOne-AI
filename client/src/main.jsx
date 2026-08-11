import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
import React from 'react'
import ReactDom from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDom.createRoot(document.getElementById('root')).render(<React.StrictMode>
  <App />

</React.StrictMode>,)

