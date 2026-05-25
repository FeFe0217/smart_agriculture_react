// src/components/Layout/TopNav.jsx
import React from 'react';

function TopNav() {
  return (
    <header className="top-nav">
      <div className="nav-left">
        {/* 请将四川大学校徽图片放在 public/scu-logo.png 路径下 */}
        <img src="/scu-logo.png" alt="四川大学校徽" className="uni-logo" />
      </div>
      <div className="nav-center">智慧农业灌溉平台</div>
      <div className="nav-right">24℃ 晴天</div>
    </header>
  );
}

export default TopNav;