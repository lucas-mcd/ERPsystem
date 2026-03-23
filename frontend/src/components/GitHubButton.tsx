import React from 'react'
import { Github } from 'lucide-react'

export function GitHubButton() {
  return (
    <a href="https://github.com/lucas-mcd" target="_blank" rel="noopener noreferrer" className="liquid-button">
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
        <Github className="w-4 h-4" />
        GitHub
      </span>
      <div className="liquid">
        <div></div>
        <div></div>
      </div>
      <div className="bubbles">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>
    </a>
  )
}

export default GitHubButton
