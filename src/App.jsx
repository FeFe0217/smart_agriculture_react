// src/App.jsx
import React from 'react';
import TopNav from './components/Layout/TopNav';
import FarmView from './components/FarmView/FarmView';
import './styles/global.css';
import './styles/farm.css';

function App() {
  return (
    <div className="app">
      <TopNav />
      <FarmView />
    </div>
  );
}

export default App;