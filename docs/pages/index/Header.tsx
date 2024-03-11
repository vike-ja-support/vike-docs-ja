import React from 'react'
import './Header.css'
import iconVike from '../../images/icons/vike-vertical.svg'

export { Header }

function Header() {
  return (
    <div id="header-logo">
      <img src={iconVike} />
      <div>
        <h1>Vike</h1>
        <p id="header-tagline">Next.js/Nuxtの様で、一つのことをうまくやるViteプラグイン</p>
      </div>
    </div>
  )
}
