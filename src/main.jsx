/**
 * Application Entry Point
 * Mounts the top-level React root node, injects global stylesheets, and initializes internationalization.
 */

import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'

/**
 * Root DOM Element Mounting
 * Renders the primary application hierarchy into the document root.
 */
createRoot(document.getElementById('root')).render(
    <App />
)
